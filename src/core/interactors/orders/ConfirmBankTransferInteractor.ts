import { IOrderEventsRepository } from "../../adapters/repositories/orderEvents/IOrderEventsRepository";
import { IOrdersRepository } from "../../adapters/repositories/orders/IOrdersRepository";
import { Order } from "../../entities/orders/Order";
import { NotifyOrderApprovedInteractor } from "./NotifyOrderApprovedInteractor";
import { OrderNotFoundError } from "./OrderNotFoundError";
import { OrderNotTransferConfirmableError } from "./OrderNotTransferConfirmableError";

/**
 * The admin checked by hand that the transfer landed: flips the order
 * pending -> approved (only bank-transfer orders, only once) and fires the
 * same confirmation email + Meta Purchase as any other approved order.
 */
export class ConfirmBankTransferInteractor {
  constructor(
    private readonly ordersRepository: IOrdersRepository,
    private readonly orderEventsRepository: IOrderEventsRepository,
    private readonly notifyOrderApprovedInteractor: NotifyOrderApprovedInteractor,
  ) {}

  async execute(orderId: string): Promise<Order> {
    const order = await this.ordersRepository.getById(orderId);

    if (!order) {
      throw new OrderNotFoundError(orderId);
    }

    const approved = await this.ordersRepository.approveBankTransfer(orderId);

    if (!approved) {
      throw new OrderNotTransferConfirmableError(orderId);
    }

    await this.orderEventsRepository.append({
      orderId,
      eventType: "bank_transfer_confirmed",
      payload: { total: order.total, currency: order.currency },
    });

    await this.notifyOrderApprovedInteractor.execute(orderId);

    const updated = await this.ordersRepository.getById(orderId);
    return updated ?? { ...order, status: "approved" };
  }
}
