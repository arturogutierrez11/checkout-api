export class OrderNotShippableError extends Error {
  constructor(public readonly orderId: string) {
    super(`Order is not approved or already shipped: ${orderId}`);
    this.name = "OrderNotShippableError";
  }
}
