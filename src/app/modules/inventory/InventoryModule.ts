import { Module } from "@nestjs/common";
import {
  IInventoryMovementsRepository,
  INVENTORY_MOVEMENTS_REPOSITORY,
} from "../../../core/adapters/repositories/inventoryMovements/IInventoryMovementsRepository";
import {
  IProductsRepository,
  PRODUCTS_REPOSITORY,
} from "../../../core/adapters/repositories/products/IProductsRepository";
import { ListInventoryMovementsInteractor } from "../../../core/interactors/inventory/ListInventoryMovementsInteractor";
import { RecordGiftInteractor } from "../../../core/interactors/inventory/RecordGiftInteractor";
import { RestockProductInteractor } from "../../../core/interactors/inventory/RestockProductInteractor";
import { ListAllProductsInteractor } from "../../../core/interactors/products/ListAllProductsInteractor";
import { InventoryController } from "../../controllers/inventory/InventoryController";
import { CheckoutInternalGuard } from "../../services/checkoutInternalAuth/guards/CheckoutInternalGuard";
import { InventoryService } from "../../services/inventory/InventoryService";

@Module({
  controllers: [InventoryController],
  providers: [
    {
      provide: ListAllProductsInteractor,
      useFactory: (productsRepository: IProductsRepository) =>
        new ListAllProductsInteractor(productsRepository),
      inject: [PRODUCTS_REPOSITORY],
    },
    {
      provide: ListInventoryMovementsInteractor,
      useFactory: (
        inventoryMovementsRepository: IInventoryMovementsRepository,
      ) => new ListInventoryMovementsInteractor(inventoryMovementsRepository),
      inject: [INVENTORY_MOVEMENTS_REPOSITORY],
    },
    {
      provide: RestockProductInteractor,
      useFactory: (
        productsRepository: IProductsRepository,
        inventoryMovementsRepository: IInventoryMovementsRepository,
      ) =>
        new RestockProductInteractor(
          productsRepository,
          inventoryMovementsRepository,
        ),
      inject: [PRODUCTS_REPOSITORY, INVENTORY_MOVEMENTS_REPOSITORY],
    },
    {
      provide: RecordGiftInteractor,
      useFactory: (
        productsRepository: IProductsRepository,
        inventoryMovementsRepository: IInventoryMovementsRepository,
      ) =>
        new RecordGiftInteractor(
          productsRepository,
          inventoryMovementsRepository,
        ),
      inject: [PRODUCTS_REPOSITORY, INVENTORY_MOVEMENTS_REPOSITORY],
    },
    CheckoutInternalGuard,
    InventoryService,
  ],
})
export class InventoryModule {}
