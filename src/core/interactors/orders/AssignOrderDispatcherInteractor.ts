import { IOrdersRepository } from "../../adapters/repositories/orders/IOrdersRepository";
import { DISPATCHERS } from "../../entities/orders/dispatchers";
import { Order } from "../../entities/orders/Order";
import { InvalidDispatcherError } from "./InvalidDispatcherError";
import { OrderNotFoundError } from "./OrderNotFoundError";

export class AssignOrderDispatcherInteractor {
  constructor(private readonly ordersRepository: IOrdersRepository) {}

  async execute(orderId: string, dispatcher: string | null): Promise<Order> {
    if (
      dispatcher &&
      !(DISPATCHERS as readonly string[]).includes(dispatcher)
    ) {
      throw new InvalidDispatcherError(dispatcher);
    }

    const assigned = await this.ordersRepository.assignDispatcher(
      orderId,
      dispatcher,
    );

    if (!assigned) {
      throw new OrderNotFoundError(orderId);
    }

    const order = await this.ordersRepository.getById(orderId);

    if (!order) {
      throw new OrderNotFoundError(orderId);
    }

    return order;
  }
}
