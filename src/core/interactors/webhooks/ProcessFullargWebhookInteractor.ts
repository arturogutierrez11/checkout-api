import { IOrderEventsRepository } from "../../adapters/repositories/orderEvents/IOrderEventsRepository";
import { IOrdersRepository } from "../../adapters/repositories/orders/IOrdersRepository";
import { IOrderEmailSender } from "../../adapters/services/orderEmail/IOrderEmailSender";
import { Order, ShippingStatus } from "../../entities/orders/Order";

export interface ProcessFullargWebhookInput {
  /** Header X-3PL-Event (ej. "shipment.dispatched"). */
  event: string | undefined;
  /** Header X-3PL-Event-Id, estable entre reintentos. */
  eventId: string | undefined;
  body: unknown;
}

/**
 * Fullarg avisa varios eventos (order.created, stock.changed, shipment.*...).
 * Solo avanzamos nuestro shippingStatus con los que importan; el último evento
 * se guarda tal cual en fullargStatus y el payload completo queda en
 * order_events para poder auditar qué mandaron.
 */
const EVENT_TO_SHIPPING_STATUS: Record<string, ShippingStatus> = {
  "shipment.dispatched": "shipped",
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Los eventos pueden venir con los datos en la raíz o anidados; busco en los lugares habituales. */
const NESTED_KEYS = ["data", "payload", "order", "shipment"] as const;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function pickString(body: unknown, keys: string[]): string | null {
  const root = asRecord(body);

  if (!root) {
    return null;
  }

  const nested = (scope: Record<string, unknown>) =>
    NESTED_KEYS.map((key) => asRecord(scope[key])).filter(
      (item): item is Record<string, unknown> => item !== null,
    );

  // Raíz, un nivel (data, shipment...) y dos (data.shipment...).
  const firstLevel = nested(root);
  const scopes = [root, ...firstLevel, ...firstLevel.flatMap(nested)];

  for (const scope of scopes) {
    for (const key of keys) {
      const value = scope[key];

      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }

      // Los números de seguimiento a veces vienen como número, no como texto.
      if (typeof value === "number" && Number.isFinite(value)) {
        return String(value);
      }
    }
  }

  return null;
}

export class ProcessFullargWebhookInteractor {
  constructor(
    private readonly ordersRepository: IOrdersRepository,
    private readonly orderEventsRepository: IOrderEventsRepository,
    private readonly orderEmailSender: IOrderEmailSender,
  ) {}

  /** `matched` = encontramos una orden nuestra a la que corresponde el evento. */
  async execute(
    input: ProcessFullargWebhookInput,
  ): Promise<{ matched: boolean }> {
    const salesOrder = pickString(input.body, ["sales_order", "salesOrder"]);
    const externalOrderId = pickString(input.body, [
      "external_order_id",
      "externalOrderId",
    ]);

    const order = await this.findOrder(salesOrder, externalOrderId);

    // Eventos que no son de una orden nuestra (stock.changed, otros
    // comercios...) se ignoran sin error para que Fullarg no reintente.
    if (!order || !input.event) {
      return { matched: false };
    }

    const carrier = pickString(input.body, [
      "carrier",
      "carrier_name",
      "courier",
    ]);
    const trackingNumber = pickString(input.body, [
      "tracking_number",
      "trackingNumber",
      "tracking",
      "tracking_code",
    ]);

    const trackingUrl = pickString(input.body, [
      "tracking_url",
      "trackingUrl",
      "tracking_link",
    ]);

    await this.ordersRepository.updateFullargStatus(
      order.id,
      input.event,
      carrier || trackingNumber || trackingUrl
        ? { carrier, trackingNumber, trackingUrl }
        : undefined,
    );

    const mappedStatus = EVENT_TO_SHIPPING_STATUS[input.event];

    if (mappedStatus && order.shippingStatus !== "delivered") {
      await this.ordersRepository.setShippingStatus(order.id, mappedStatus);
    }

    await this.orderEventsRepository.append({
      orderId: order.id,
      eventType: "fullarg_webhook",
      payload: {
        event: input.event,
        eventId: input.eventId ?? null,
        body: asRecord(input.body) ?? {},
      },
    });

    // El número de seguimiento recién llega con el despacho: en ese momento (y
    // solo una vez) se le avisa al comprador.
    if (order.status === "approved") {
      await this.notifyTracking(order.id);
    }

    return { matched: true };
  }

  /**
   * Manda el mail "Tu pedido está en camino" con el seguimiento. Un fallo del
   * mail nunca rompe el webhook: se devuelve el turno para reintentar con el
   * próximo evento (o a mano desde el panel) y queda registrado.
   */
  private async notifyTracking(orderId: string): Promise<void> {
    const claimed = await this.ordersRepository.claimShippedEmail(orderId);

    if (!claimed) {
      return;
    }

    const order = await this.ordersRepository.getById(orderId);

    if (!order) {
      return;
    }

    try {
      await this.orderEmailSender.sendOrderShipped(order);
      await this.orderEventsRepository.append({
        orderId,
        eventType: "shipped_email_sent",
        payload: {
          provider: "fullarg",
          carrier: order.shippingCarrier,
          trackingNumber: order.shippingTrackingNumber,
        },
      });
    } catch (err) {
      await this.ordersRepository.releaseShippedEmail(orderId);
      await this.orderEventsRepository.append({
        orderId,
        eventType: "shipped_email_failed",
        payload: { message: err instanceof Error ? err.message : String(err) },
      });
    }
  }

  private async findOrder(
    salesOrder: string | null,
    externalOrderId: string | null,
  ): Promise<Order | null> {
    if (salesOrder) {
      const bySalesOrder =
        await this.ordersRepository.findByFullargSalesOrder(salesOrder);

      if (bySalesOrder) {
        return bySalesOrder;
      }
    }

    if (externalOrderId && UUID.test(externalOrderId)) {
      return this.ordersRepository.getById(externalOrderId);
    }

    return null;
  }
}
