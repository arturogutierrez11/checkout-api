import { IOrderEventsRepository } from "../../adapters/repositories/orderEvents/IOrderEventsRepository";
import { IOrdersRepository } from "../../adapters/repositories/orders/IOrdersRepository";
import { IZipnovaGateway } from "../../adapters/services/zipnova/IZipnovaGateway";
import { Order } from "../../entities/orders/Order";
import { OrderNotFoundError } from "./OrderNotFoundError";
import { OrderNotShippableError } from "./OrderNotShippableError";
import { ReserveOrderStockInteractor } from "./ReserveOrderStockInteractor";
import { ShippingQuoteUnavailableError } from "./ShippingQuoteUnavailableError";

const CORREO_ARGENTINO = "Correo Argentino";

/**
 * pickup_point service types need a destination.point_id chosen from a list
 * of nearby branches, which doesn't fit an unattended flow — and the
 * checkout already promised home delivery to the address the customer typed.
 */
const PICKUP_POINT_SERVICE_TYPE = "pickup_point";

/** Best-effort split of a free-text Argentine address into street + number. */
function splitStreetAndNumber(address: string): {
  street: string;
  streetNumber: string;
} {
  const match = /^(.*?)(\d+)\s*$/.exec(address.trim());

  if (!match) {
    return { street: address.trim(), streetNumber: "S/N" };
  }

  return { street: match[1].trim(), streetNumber: match[2] };
}

export class GenerateShippingLabelInteractor {
  constructor(
    private readonly ordersRepository: IOrdersRepository,
    private readonly reserveOrderStockInteractor: ReserveOrderStockInteractor,
    private readonly zipnovaGateway: IZipnovaGateway,
    private readonly orderEventsRepository: IOrderEventsRepository,
  ) {}

  async execute(orderId: string, warehouseId: string): Promise<Order> {
    const order = await this.ordersRepository.getById(orderId);

    if (!order) {
      throw new OrderNotFoundError(orderId);
    }

    if (order.status !== "approved") {
      throw new OrderNotShippableError(orderId);
    }

    if (order.shippingZipnovaShipmentId) {
      return order;
    }

    const { warehouse: originWarehouse, cardUnits } =
      await this.reserveOrderStockInteractor.execute(order, warehouseId);

    const quotes = await this.zipnovaGateway.quoteShipment({
      originId: originWarehouse.zipnovaOriginId,
      declaredValue: order.subtotal,
      cardUnits,
      destination: {
        city: order.shippingCity,
        state: order.shippingProvince,
        zipcode: order.shippingPostalCode,
      },
    });

    const correoOptions = quotes.filter(
      (quote) =>
        quote.carrierName === CORREO_ARGENTINO &&
        quote.serviceType !== PICKUP_POINT_SERVICE_TYPE,
    );

    if (correoOptions.length === 0) {
      throw new ShippingQuoteUnavailableError(orderId);
    }

    const cheapest = correoOptions.reduce((min, current) =>
      current.price < min.price ? current : min,
    );

    const { street, streetNumber } = splitStreetAndNumber(
      order.shippingAddress,
    );

    const created = await this.zipnovaGateway.createShipment({
      originId: originWarehouse.zipnovaOriginId,
      carrierId: cheapest.carrierId,
      serviceType: cheapest.serviceType,
      logisticType: cheapest.logisticType,
      declaredValue: order.subtotal,
      // Zipnova caps external_id at 30 chars; a UUID is 36 (32 without dashes).
      externalId: order.id.replace(/-/g, "").slice(0, 30),
      cardUnits,
      destination: {
        name: `${order.customerFirstName} ${order.customerLastName}`,
        street,
        streetNumber,
        document: order.billingDni,
        email: order.customerEmail,
        phone: order.customerPhone,
        city: order.shippingCity,
        state: order.shippingProvince,
        zipcode: order.shippingPostalCode,
      },
    });

    await this.ordersRepository.saveShipmentDetails(orderId, {
      carrier: CORREO_ARGENTINO,
      trackingNumber: created.trackingNumber,
      realCost: created.price,
      zipnovaShipmentId: String(created.id),
    });

    await this.orderEventsRepository.append({
      orderId,
      eventType: "shipping_label_generated",
      payload: {
        provider: "zipnova",
        zipnovaShipmentId: created.id,
        carrier: CORREO_ARGENTINO,
        serviceType: cheapest.serviceType,
        trackingNumber: created.trackingNumber,
        realCost: created.price,
        warehouseId: originWarehouse.id,
        warehouseSlug: originWarehouse.slug,
      },
    });

    const updated = await this.ordersRepository.getById(orderId);
    return updated ?? order;
  }
}
