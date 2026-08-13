export class InvalidWebhookSignatureError extends Error {
  constructor() {
    super("Invalid Mercado Pago webhook signature");
    this.name = "InvalidWebhookSignatureError";
  }
}
