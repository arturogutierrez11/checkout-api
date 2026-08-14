export class OrderNotCancellableError extends Error {
  constructor(public readonly orderId: string) {
    super(`Order is not pending, cannot cancel: ${orderId}`);
    this.name = "OrderNotCancellableError";
  }
}
