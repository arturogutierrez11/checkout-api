import { Injectable } from "@nestjs/common";
import { ListProductsInteractor } from "../../../core/interactors/products/ListProductsInteractor";
import { Product } from "../../../core/entities/products/Product";

@Injectable()
export class ProductsService {
  constructor(
    private readonly listProductsInteractor: ListProductsInteractor,
  ) {}

  list(): Promise<Product[]> {
    return this.listProductsInteractor.execute();
  }
}
