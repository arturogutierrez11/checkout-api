export class OrderNotTransferConfirmableError extends Error {
  constructor(public readonly orderId: string) {
    super(
      `Order is not a pending bank-transfer order, cannot confirm: ${orderId}`,
    );
    this.name = "OrderNotTransferConfirmableError";
  }
}
