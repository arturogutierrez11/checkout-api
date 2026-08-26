import { IOrderEventsRepository } from "../../adapters/repositories/orderEvents/IOrderEventsRepository";
import { IOrdersRepository } from "../../adapters/repositories/orders/IOrdersRepository";
import { IOrderEmailSender } from "../../adapters/services/orderEmail/IOrderEmailSender";
import { MarkShippedData, Order } from "../../entities/orders/Order";
import { OrderNotFoundError } from "./OrderNotFoundError";
import { OrderNotShippableError } from "./OrderNotShippableError";
import { ReserveOrderStockInteractor } from "./ReserveOrderStockInteractor";

/**
 * Marks an order shipped by a carrier the admin typed in by hand — Correo
 * Argentino without going through Zipnova, moto, entrega en persona, etc.
 * Reserves stock at the chosen depósito first (a no-op if this order already
 * had it reserved through a Zipnova label), so every fulfilled order ends up
 * with its stock decremented exactly once, no matter which path it took.
 */
export class MarkOrderShippedInteractor {
  constructor(
    private readonly ordersRepository: IOrdersRepository,
    private readonly reserveOrderStockInteractor: ReserveOrderStockInteractor,
    private readonly orderEventsRepository: IOrderEventsRepository,
    private readonly orderEmailSender: IOrderEmailSender,
  ) {}

  async execute(
    orderId: string,
    data: MarkShippedData,
    warehouseId: string,
  ): Promise<Order> {
    const order = await this.ordersRepository.getById(orderId);

    if (!order) {
      throw new OrderNotFoundError(orderId);
    }

    if (order.status !== "approved" || order.shippedAt) {
      throw new OrderNotShippableError(orderId);
    }

    await this.reserveOrderStockInteractor.execute(order, warehouseId);

    const shipped = await this.ordersRepository.markShipped(orderId, data);

    if (!shipped) {
      throw new OrderNotShippableError(orderId);
    }

    await this.orderEventsRepository.append({
      orderId,
      eventType: "marked_shipped",
      payload: {
        carrier: data.carrier,
        trackingNumber: data.trackingNumber,
        labelUrl: data.labelUrl,
      },
    });

    const updated = await this.ordersRepository.getById(orderId);

    try {
      await this.orderEmailSender.sendOrderShipped(updated ?? order);
    } catch (err) {
      await this.orderEventsRepository.append({
        orderId,
        eventType: "shipped_email_failed",
        payload: { message: err instanceof Error ? err.message : String(err) },
      });
    }

    return updated ?? order;
  }
}
