import { Order } from "../../../entities/orders/Order";

export const ORDER_EMAIL_SENDER = Symbol("ORDER_EMAIL_SENDER");

export interface IOrderEmailSender {
  sendOrderConfirmation(order: Order): Promise<void>;
}
