export type OrderStatus =
  "pending" | "approved" | "rejected" | "cancelled" | "payment_init_failed";

export type ShippingMethod = "standard" | "express";

/** Independent from OrderStatus (payment). Auto-advances from the Zipnova status webhook. */
export type ShippingStatus =
  "pending_dispatch" | "dispatched" | "shipped" | "delivered" | "cancelled";

export interface Order {
  id: string;

  productId: string;
  productSku: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  currency: string;
  subtotal: number;

  shippingMethod: ShippingMethod;
  shippingPrice: number;
  total: number;

  status: OrderStatus;

  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;

  shippingAddress: string;
  shippingCity: string;
  shippingProvince: string;
  shippingPostalCode: string;

  billingDni: string;
  billingUseShippingAddress: boolean;
  billingAddress: string | null;
  billingCity: string | null;
  billingProvince: string | null;
  billingPostalCode: string | null;
  isBusinessPurchase: boolean;
  billingCuit: string | null;
  billingBusinessName: string | null;

  mpPreferenceId: string | null;
  mpInitPoint: string | null;
  mpPaymentId: string | null;
  mpPaymentStatus: string | null;
  mpPaymentStatusDetail: string | null;

  shippingStatus: ShippingStatus;
  shippingCarrier: string | null;
  shippingTrackingNumber: string | null;
  shippingLabelUrl: string | null;
  shippedAt: Date | null;
  /** What Rituo pays Zipnova for the shipment — independent of shippingPrice, which is what the customer pays (always 0 today). */
  shippingRealCost: number | null;
  shippingZipnovaShipmentId: string | null;
  /** Last raw status_code Zipnova reported via webhook (e.g. "in_transit", "out_for_delivery"). */
  shippingZipnovaStatus: string | null;

  invoiceStatus: string | null;
  invoiceCae: string | null;
  invoiceType: string | null;
  invoiceNumber: string | null;
  invoicedAt: Date | null;

  approvedAt: Date | null;
  emailSentAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderData {
  productId: string;
  productSku: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  currency: string;
  subtotal: number;

  shippingMethod: ShippingMethod;
  shippingPrice: number;
  total: number;

  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;

  shippingAddress: string;
  shippingCity: string;
  shippingProvince: string;
  shippingPostalCode: string;

  billingDni: string;
  billingUseShippingAddress: boolean;
  billingAddress: string | null;
  billingCity: string | null;
  billingProvince: string | null;
  billingPostalCode: string | null;
  isBusinessPurchase: boolean;
  billingCuit: string | null;
  billingBusinessName: string | null;
}

export interface UpdateMpPaymentInfoData {
  mpPaymentId: string;
  mpPaymentStatus: string;
  mpPaymentStatusDetail: string;
}

export interface MarkShippedData {
  carrier: string | null;
  trackingNumber: string | null;
  labelUrl: string | null;
}

export interface SaveShipmentData {
  carrier: string;
  trackingNumber: string | null;
  realCost: number;
  zipnovaShipmentId: string;
}
