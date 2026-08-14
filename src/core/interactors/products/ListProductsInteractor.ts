import { IProductsRepository } from "../../adapters/repositories/products/IProductsRepository";
import {
  CARDS_SKU,
  PACKAGING_SKU,
  Product,
} from "../../entities/products/Product";

/**
 * Commercial SKUs don't carry their own stock anymore — they're bundles of
 * the shared card/packaging pools. Availability is however many full
 * bundles those pools can still cover.
 */
export class ListProductsInteractor {
  constructor(private readonly productsRepository: IProductsRepository) {}

  async execute(): Promise<Product[]> {
    const products = await this.productsRepository.listActive();
    const [cardsProduct, packaging] = await Promise.all([
      this.productsRepository.getBySku(CARDS_SKU),
      this.productsRepository.getBySku(PACKAGING_SKU),
    ]);

    const availablePool = Math.min(
      cardsProduct?.stock ?? 0,
      packaging?.stock ?? 0,
    );

    return products.map((product) => ({
      ...product,
      stock:
        product.bundleUnits > 0
          ? Math.floor(availablePool / product.bundleUnits)
          : 0,
    }));
  }
}
