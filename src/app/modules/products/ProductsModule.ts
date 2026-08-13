import { Module } from "@nestjs/common";
import {
  IProductsRepository,
  PRODUCTS_REPOSITORY,
} from "../../../core/adapters/repositories/products/IProductsRepository";
import { ListProductsInteractor } from "../../../core/interactors/products/ListProductsInteractor";
import { ProductsController } from "../../controllers/products/ProductsController";
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
    ProductsService,
  ],
  exports: [ProductsService],
})
export class ProductsModule {}
