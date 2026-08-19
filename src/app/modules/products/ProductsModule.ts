import { Module } from "@nestjs/common";
import {
  IProductsRepository,
  PRODUCTS_REPOSITORY,
} from "../../../core/adapters/repositories/products/IProductsRepository";
import { ListProductsInteractor } from "../../../core/interactors/products/ListProductsInteractor";
import { ListAllProductsInteractor } from "../../../core/interactors/products/ListAllProductsInteractor";
import { UpdateProductPriceInteractor } from "../../../core/interactors/products/UpdateProductPriceInteractor";
import { ProductsController } from "../../controllers/products/ProductsController";
import { CheckoutInternalGuard } from "../../services/checkoutInternalAuth/guards/CheckoutInternalGuard";
import { ProductsService } from "../../services/products/ProductsService";

@Module({
  controllers: [ProductsController],
  providers: [
    {
      provide: ListProductsInteractor,
      useFactory: (repository: IProductsRepository) =>
        new ListProductsInteractor(repository),
      inject: [PRODUCTS_REPOSITORY],
    },
    {
      provide: ListAllProductsInteractor,
      useFactory: (repository: IProductsRepository) =>
        new ListAllProductsInteractor(repository),
      inject: [PRODUCTS_REPOSITORY],
    },
    {
      provide: UpdateProductPriceInteractor,
      useFactory: (repository: IProductsRepository) =>
        new UpdateProductPriceInteractor(repository),
      inject: [PRODUCTS_REPOSITORY],
    },
    CheckoutInternalGuard,
    ProductsService,
  ],
  exports: [ProductsService],
})
export class ProductsModule {}
