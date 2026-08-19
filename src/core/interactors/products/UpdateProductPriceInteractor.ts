import { IProductsRepository } from "../../adapters/repositories/products/IProductsRepository";
import { Product } from "../../entities/products/Product";
import { ProductNotFoundByIdError } from "./ProductNotFoundByIdError";

export class UpdateProductPriceInteractor {
  constructor(private readonly productsRepository: IProductsRepository) {}

  async execute(productId: string, price: number): Promise<Product> {
    const updated = await this.productsRepository.updatePrice(productId, price);

    if (!updated) {
      throw new ProductNotFoundByIdError(productId);
    }

    return updated;
  }
}
