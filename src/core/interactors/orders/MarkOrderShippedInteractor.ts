import { IOrderEventsRepository } from "../../adapters/repositories/orderEvents/IOrderEventsRepository";
import { IOrdersRepository } from "../../adapters/repositories/orders/IOrdersRepository";
import { MarkShippedData, Order } from "../../entities/orders/Order";
import { OrderNotFoundError } from "./OrderNotFoundError";
import { OrderNotShippableError } from "./OrderNotShippableError";

export class MarkOrderShippedInteractor {
  constructor(
    private readonly ordersRepository: IOrdersRepository,
    private readonly orderEventsRepository: IOrderEventsRepository,
  ) {}

  async execute(orderId: string, data: MarkShippedData): Promise<Order> {
    const order = await this.ordersRepository.getById(orderId);

    if (!order) {
      throw new OrderNotFoundError(orderId);
    }

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
    return updated ?? order;
  }
}
