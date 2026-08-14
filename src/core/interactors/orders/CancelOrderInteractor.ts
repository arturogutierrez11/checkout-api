import { IOrderEventsRepository } from "../../adapters/repositories/orderEvents/IOrderEventsRepository";
import { IOrdersRepository } from "../../adapters/repositories/orders/IOrdersRepository";
import { Order } from "../../entities/orders/Order";
import { ReleaseOrderStockInteractor } from "../inventory/ReleaseOrderStockInteractor";
import { OrderNotCancellableError } from "./OrderNotCancellableError";
import { OrderNotFoundError } from "./OrderNotFoundError";

export class CancelOrderInteractor {
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

    const cancelled = await this.ordersRepository.cancelPending(orderId);

    if (!cancelled) {
      throw new OrderNotCancellableError(orderId);
    }

    await this.releaseOrderStockInteractor.execute({
      orderId,
      productId: order.productId,
      quantity: order.quantity,
      movementType: "cancellation",
      note: "cancelled_manually",
    });
    await this.orderEventsRepository.append({
      orderId,
      eventType: "cancelled_manually",
      payload: {},
    });

    const updated = await this.ordersRepository.getById(orderId);
    return updated ?? { ...order, status: "cancelled" };
  }
}
