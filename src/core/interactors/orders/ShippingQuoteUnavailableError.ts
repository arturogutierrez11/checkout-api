export class ShippingQuoteUnavailableError extends Error {
  constructor(public readonly orderId: string) {
    super(`Correo Argentino has no quote available for order: ${orderId}`);
    this.name = "ShippingQuoteUnavailableError";
  }
}
