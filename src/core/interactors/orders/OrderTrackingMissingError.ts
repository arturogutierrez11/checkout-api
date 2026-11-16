export class OrderTrackingMissingError extends Error {
  constructor(public readonly orderId: string) {
    super(
      "La orden todavía no tiene número de seguimiento: Fullarg lo informa cuando despacha.",
    );
    this.name = "OrderTrackingMissingError";
  }
}
