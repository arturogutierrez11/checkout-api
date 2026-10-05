import { Order } from "../../../entities/orders/Order";

export const ORDER_EMAIL_SENDER = Symbol("ORDER_EMAIL_SENDER");

export interface IOrderEmailSender {
  sendOrderConfirmation(order: Order): Promise<void>;
  sendOrderShipped(order: Order): Promise<void>;
  /** Bank-transfer orders: customer gets the account details + amount, the team gets a heads-up that one is waiting for reconciliation. */
  sendTransferInstructions(order: Order): Promise<void>;
}
