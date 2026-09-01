import {
  CreateManualOrderData,
  CreateOrderData,
  MarkShippedData,
  Order,
  OrderStatus,
  SaveShipmentData,
  ShippingStatus,
  UpdateMpPaymentInfoData,
} from "../../../entities/orders/Order";

export const ORDERS_REPOSITORY = Symbol("ORDERS_REPOSITORY");

export interface IOrdersRepository {
  create(data: CreateOrderData): Promise<Order>;
  /** Inserted already 'approved' (payment happened outside the system). */
  createManual(data: CreateManualOrderData): Promise<Order>;
  getById(id: string): Promise<Order | null>;
  findByZipnovaShipmentId(shipmentId: string): Promise<Order | null>;
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
  /** Atomic: only sets meta_purchase_sent_at if it was still null. Returns whether it did. */
  markMetaPurchaseSent(orderId: string): Promise<boolean>;
  clearMetaPurchaseSent(orderId: string): Promise<void>;
  /** Atomic: only cancels if it was still 'pending'. Returns whether it did. */
  cancelPending(orderId: string): Promise<boolean>;
  /** Atomic: only marks shipped if the order is 'approved' and not shipped yet. Returns whether it did. */
  markShipped(orderId: string, data: MarkShippedData): Promise<boolean>;
  /** Atomic: only saves if the order doesn't already have a Zipnova shipment (idempotency). Returns whether it did. */
  saveShipmentDetails(
    orderId: string,
    data: SaveShipmentData,
  ): Promise<boolean>;
  /** Clears a voided Zipnova shipment so a new label can be generated. Atomic: only clears if one was actually set. Returns whether it did. */
  resetShippingLabel(orderId: string): Promise<boolean>;
  /** Pass null to unassign. Returns whether the order existed. */
  assignDispatcher(
    orderId: string,
    dispatcher: string | null,
  ): Promise<boolean>;
  /** Manual (or webhook-driven) status set. Stamps shipped_at when transitioning to 'shipped' if not already set. Returns whether the order existed. */
  setShippingStatus(orderId: string, status: ShippingStatus): Promise<boolean>;
  /** Records the last raw status Zipnova reported, independent of the simplified shippingStatus. */
  updateZipnovaRawStatus(orderId: string, rawStatus: string): Promise<void>;
  /** Manual invoicing flag until a real AFIP/ARCA integration exists. Returns whether the order existed. */
  setInvoiceStatus(orderId: string, invoiced: boolean): Promise<boolean>;
}
