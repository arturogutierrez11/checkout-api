export class ProductNotFoundByIdError extends Error {
  constructor(public readonly productId: string) {
    super(`Product not found: ${productId}`);
    this.name = "ProductNotFoundByIdError";
  }
}
