import { Injectable, NotFoundException } from "@nestjs/common";
import { ListProductsInteractor } from "../../../core/interactors/products/ListProductsInteractor";
import { ListAllProductsInteractor } from "../../../core/interactors/products/ListAllProductsInteractor";
import { UpdateProductPriceInteractor } from "../../../core/interactors/products/UpdateProductPriceInteractor";
import { ProductNotFoundByIdError } from "../../../core/interactors/products/ProductNotFoundByIdError";
import { Product } from "../../../core/entities/products/Product";
import { ApiErrorCode, apiError } from "../../errors/ApiErrorResponse";

@Injectable()
export class ProductsService {
  constructor(
    private readonly listProductsInteractor: ListProductsInteractor,
    private readonly listAllProductsInteractor: ListAllProductsInteractor,
    private readonly updateProductPriceInteractor: UpdateProductPriceInteractor,
  ) {}

  list(): Promise<Product[]> {
    return this.listProductsInteractor.execute();
  }

  /** Admin only: every SKU, commercial and internal, with its real id and price. */
  listAll(): Promise<Product[]> {
    return this.listAllProductsInteractor.execute();
  }

  async updatePrice(productId: string, price: number): Promise<Product> {
    try {
      return await this.updateProductPriceInteractor.execute(productId, price);
    } catch (err) {
      if (err instanceof ProductNotFoundByIdError) {
        throw new NotFoundException(
          apiError(ApiErrorCode.productNotFound, err.message),
        );
      }
      throw err;
    }
  }
}
