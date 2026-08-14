export const ApiErrorCode = {
  productNotFound: "PRODUCT_NOT_FOUND",
  insufficientStock: "INSUFFICIENT_STOCK",
  paymentPreferenceCreationFailed: "PAYMENT_PREFERENCE_CREATION_FAILED",
  orderNotFound: "ORDER_NOT_FOUND",
  orderNotCancellable: "ORDER_NOT_CANCELLABLE",
  orderNotShippable: "ORDER_NOT_SHIPPABLE",
  idempotencyKeyReused: "IDEMPOTENCY_KEY_REUSED",
  invalidWebhookSignature: "INVALID_WEBHOOK_SIGNATURE",
} as const;

export function apiError(code: string, message: string) {
  return { code, message };
}
