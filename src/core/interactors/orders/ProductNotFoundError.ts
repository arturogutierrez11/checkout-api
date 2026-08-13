export class ProductNotFoundError extends Error {
  constructor(public readonly productSlug: string) {
    super(`Product not found: ${productSlug}`);
    this.name = "ProductNotFoundError";
  }
}
