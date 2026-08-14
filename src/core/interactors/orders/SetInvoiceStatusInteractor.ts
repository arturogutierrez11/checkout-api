import { IOrderEventsRepository } from "../../adapters/repositories/orderEvents/IOrderEventsRepository";
import { IOrdersRepository } from "../../adapters/repositories/orders/IOrdersRepository";
import { Order } from "../../entities/orders/Order";
import { OrderNotFoundError } from "./OrderNotFoundError";

export class SetInvoiceStatusInteractor {
  constructor(
    private readonly ordersRepository: IOrdersRepository,
    private readonly orderEventsRepository: IOrderEventsRepository,
  ) {}

  async execute(orderId: string, invoiced: boolean): Promise<Order> {
    const updated = await this.ordersRepository.setInvoiceStatus(
      orderId,
      invoiced,
    );

    if (!updated) {
      throw new OrderNotFoundError(orderId);
    }

    await this.orderEventsRepository.append({
      orderId,
      eventType: "invoice_status_changed",
      payload: { invoiced },
    });

    const order = await this.ordersRepository.getById(orderId);

    if (!order) {
      throw new OrderNotFoundError(orderId);
    }

    return order;
  }
}
