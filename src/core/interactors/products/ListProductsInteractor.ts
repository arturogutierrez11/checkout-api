import { IProductsRepository } from "../../adapters/repositories/products/IProductsRepository";
import { Product } from "../../entities/products/Product";

export class ListProductsInteractor {
  constructor(private readonly productsRepository: IProductsRepository) {}

  execute(): Promise<Product[]> {
    return this.productsRepository.listActive();
  }
}
