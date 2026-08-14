import {
  CreateOrderData,
  MarkShippedData,
  Order,
  OrderStatus,
  ShippingStatus,
  UpdateMpPaymentInfoData,
} from "../../../entities/orders/Order";

export const ORDERS_REPOSITORY = Symbol("ORDERS_REPOSITORY");

export interface IOrdersRepository {
  create(data: CreateOrderData): Promise<Order>;
  getById(id: string): Promise<Order | null>;
  list(filter: {
    status?: OrderStatus;
    limit: number;
    offset: number;
  }): Promise<Order[]>;
  setMpPreference(
    orderId: string,
    preferenceId: string,
    initPoint: string,
  ): Promise<void>;
  markPaymentInitFailed(orderId: string): Promise<void>;
  /** Atomic: only flips status if it was still 'pending'. Returns whether it did. */
  transitionStatusFromPending(
    orderId: string,
    toStatus: Extract<OrderStatus, "approved" | "rejected" | "cancelled">,
    mp: UpdateMpPaymentInfoData,
  ): Promise<boolean>;
  updateMpPaymentInfo(
    orderId: string,
    mp: UpdateMpPaymentInfoData,
  ): Promise<void>;
  /** Atomic: only sets email_sent_at if it was still null. Returns whether it did. */
  markEmailSent(orderId: string): Promise<boolean>;
  clearEmailSent(orderId: string): Promise<void>;
  /** Atomic: only cancels if it was still 'pending'. Returns whether it did. */
  cancelPending(orderId: string): Promise<boolean>;
  /** Atomic: only marks shipped if the order is 'approved' and not shipped yet. Returns whether it did. */
  markShipped(orderId: string, data: MarkShippedData): Promise<boolean>;
  /** Manual status set for the simple (non-tracking) shipping states. Returns whether the order existed. */
  setShippingStatus(orderId: string, status: ShippingStatus): Promise<boolean>;
  /** Manual invoicing flag until a real AFIP/ARCA integration exists. Returns whether the order existed. */
  setInvoiceStatus(orderId: string, invoiced: boolean): Promise<boolean>;
}
