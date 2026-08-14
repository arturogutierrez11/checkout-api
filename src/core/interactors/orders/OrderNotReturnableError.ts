export class OrderNotReturnableError extends Error {
  constructor(public readonly orderId: string) {
    super(`Order is not returnable: ${orderId}`);
    this.name = "OrderNotReturnableError";
  }
}
