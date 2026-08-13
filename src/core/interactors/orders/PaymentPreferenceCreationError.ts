export class PaymentPreferenceCreationError extends Error {
  constructor(
    public readonly orderId: string,
    cause: unknown,
  ) {
    super(
      `Failed to create Mercado Pago preference for order ${orderId}: ${
        cause instanceof Error ? cause.message : String(cause)
      }`,
    );
    this.name = "PaymentPreferenceCreationError";
  }
}
