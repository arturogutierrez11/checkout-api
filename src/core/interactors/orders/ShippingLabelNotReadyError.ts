export class ShippingLabelNotReadyError extends Error {
  constructor(public readonly orderId: string) {
    super(`Order has no Zipnova shipment yet: ${orderId}`);
    this.name = "ShippingLabelNotReadyError";
  }
}
