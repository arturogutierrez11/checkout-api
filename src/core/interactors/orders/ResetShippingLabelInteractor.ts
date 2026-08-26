import { IOrderEventsRepository } from "../../adapters/repositories/orderEvents/IOrderEventsRepository";
import { IOrdersRepository } from "../../adapters/repositories/orders/IOrdersRepository";
import { ReleaseOrderStockInteractor } from "../inventory/ReleaseOrderStockInteractor";
import { Order } from "../../entities/orders/Order";
import { OrderNotFoundError } from "./OrderNotFoundError";

/**
 * Undoes a Zipnova shipment that got voided/annulled on Zipnova's side
 * before the physical card ever left the depósito — releases the stock that
 * was reserved for it, clears the shipment fields, and resets the shipping
 * status so "Generar etiqueta de envío" becomes available again for a fresh
 * attempt (possibly from a different depósito).
 */
export class ResetShippingLabelInteractor {
  constructor(
    private readonly ordersRepository: IOrdersRepository,
    private readonly releaseOrderStockInteractor: ReleaseOrderStockInteractor,
    private readonly orderEventsRepository: IOrderEventsRepository,
  ) {}

  async execute(orderId: string): Promise<Order> {
    const order = await this.ordersRepository.getById(orderId);

    if (!order) {
      throw new OrderNotFoundError(orderId);
    }

    if (!order.shippingZipnovaShipmentId) {
      return order;
    }

    await this.releaseOrderStockInteractor.execute({
      orderId,
      productId: order.productId,
      quantity: order.quantity,
      movementType: "cancellation",
      note: "shipping_label_reset",
    });

    await this.ordersRepository.resetShippingLabel(orderId);

    await this.orderEventsRepository.append({
      orderId,
      eventType: "shipping_label_reset",
      payload: {
        previousZipnovaShipmentId: order.shippingZipnovaShipmentId,
      },
    });

    const updated = await this.ordersRepository.getById(orderId);
    return updated ?? order;
  }
}
