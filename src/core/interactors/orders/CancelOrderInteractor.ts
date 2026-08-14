import { IOrderEventsRepository } from "../../adapters/repositories/orderEvents/IOrderEventsRepository";
import { IOrdersRepository } from "../../adapters/repositories/orders/IOrdersRepository";
import { IProductsRepository } from "../../adapters/repositories/products/IProductsRepository";
import { Order } from "../../entities/orders/Order";
import { OrderNotCancellableError } from "./OrderNotCancellableError";
import { OrderNotFoundError } from "./OrderNotFoundError";

export class CancelOrderInteractor {
  constructor(
    private readonly ordersRepository: IOrdersRepository,
    private readonly productsRepository: IProductsRepository,
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

    await this.productsRepository.incrementStock(
      order.productId,
      order.quantity,
    );
    await this.orderEventsRepository.append({
      orderId,
      eventType: "cancelled_manually",
      payload: {},
    });

    const updated = await this.ordersRepository.getById(orderId);
    return updated ?? { ...order, status: "cancelled" };
  }
}
