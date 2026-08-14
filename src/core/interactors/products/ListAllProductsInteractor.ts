import { IProductsRepository } from "../../adapters/repositories/products/IProductsRepository";
import { Product } from "../../entities/products/Product";

/** Admin-only: includes internal SKUs (e.g. packaging) hidden from the public storefront. */
export class ListAllProductsInteractor {
  constructor(private readonly productsRepository: IProductsRepository) {}

  execute(): Promise<Product[]> {
    return this.productsRepository.listAll();
  }
}
