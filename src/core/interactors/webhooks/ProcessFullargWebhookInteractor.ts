import { IOrderEventsRepository } from "../../adapters/repositories/orderEvents/IOrderEventsRepository";
import { IOrdersRepository } from "../../adapters/repositories/orders/IOrdersRepository";
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

  const scopes = [
    root,
    ...NESTED_KEYS.map((key) => asRecord(root[key])).filter(
      (scope): scope is Record<string, unknown> => scope !== null,
    ),
  ];

  for (const scope of scopes) {
    for (const key of keys) {
      const value = scope[key];

      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }
  }

  return null;
}

export class ProcessFullargWebhookInteractor {
  constructor(
    private readonly ordersRepository: IOrdersRepository,
    private readonly orderEventsRepository: IOrderEventsRepository,
  ) {}

  async execute(input: ProcessFullargWebhookInput): Promise<void> {
    const salesOrder = pickString(input.body, ["sales_order", "salesOrder"]);
    const externalOrderId = pickString(input.body, [
      "external_order_id",
      "externalOrderId",
    ]);

    const order = await this.findOrder(salesOrder, externalOrderId);

    // Eventos que no son de una orden nuestra (stock.changed, otros
    // comercios...) se ignoran sin error para que Fullarg no reintente.
    if (!order || !input.event) {
      return;
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

    await this.ordersRepository.updateFullargStatus(
      order.id,
      input.event,
      carrier || trackingNumber ? { carrier, trackingNumber } : undefined,
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
