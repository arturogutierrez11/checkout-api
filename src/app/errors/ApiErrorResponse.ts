export const ApiErrorCode = {
  productNotFound: "PRODUCT_NOT_FOUND",
  insufficientStock: "INSUFFICIENT_STOCK",
  paymentPreferenceCreationFailed: "PAYMENT_PREFERENCE_CREATION_FAILED",
  orderNotFound: "ORDER_NOT_FOUND",
  orderNotCancellable: "ORDER_NOT_CANCELLABLE",
  orderNotShippable: "ORDER_NOT_SHIPPABLE",
  orderNotReturnable: "ORDER_NOT_RETURNABLE",
  shippingQuoteUnavailable: "SHIPPING_QUOTE_UNAVAILABLE",
  shippingLabelNotReady: "SHIPPING_LABEL_NOT_READY",
  zipnovaRequestFailed: "ZIPNOVA_REQUEST_FAILED",
  warehouseNotFound: "WAREHOUSE_NOT_FOUND",
  idempotencyKeyReused: "IDEMPOTENCY_KEY_REUSED",
  invalidWebhookSignature: "INVALID_WEBHOOK_SIGNATURE",
} as const;

export function apiError(code: string, message: string) {
  return { code, message };
}
