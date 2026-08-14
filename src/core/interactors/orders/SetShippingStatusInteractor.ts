import { IOrderEventsRepository } from "../../adapters/repositories/orderEvents/IOrderEventsRepository";
import { IOrdersRepository } from "../../adapters/repositories/orders/IOrdersRepository";
import { Order, ShippingStatus } from "../../entities/orders/Order";
import { OrderNotFoundError } from "./OrderNotFoundError";

export class SetShippingStatusInteractor {
  constructor(
    private readonly ordersRepository: IOrdersRepository,
    private readonly orderEventsRepository: IOrderEventsRepository,
  ) {}

  async execute(orderId: string, status: ShippingStatus): Promise<Order> {
    const updated = await this.ordersRepository.setShippingStatus(
      orderId,
      status,
    );

    if (!updated) {
      throw new OrderNotFoundError(orderId);
    }

    await this.orderEventsRepository.append({
      orderId,
      eventType: "shipping_status_changed",
      payload: { status },
    });

    const order = await this.ordersRepository.getById(orderId);

    if (!order) {
      throw new OrderNotFoundError(orderId);
    }

    return order;
  }
}
