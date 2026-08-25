import { Module } from "@nestjs/common";
import {
  IInventoryMovementsRepository,
  INVENTORY_MOVEMENTS_REPOSITORY,
} from "../../../core/adapters/repositories/inventoryMovements/IInventoryMovementsRepository";
import {
  IProductStockRepository,
  PRODUCT_STOCK_REPOSITORY,
} from "../../../core/adapters/repositories/productStock/IProductStockRepository";
import {
  IProductsRepository,
  PRODUCTS_REPOSITORY,
} from "../../../core/adapters/repositories/products/IProductsRepository";
import {
  IWarehousesRepository,
  WAREHOUSES_REPOSITORY,
} from "../../../core/adapters/repositories/warehouses/IWarehousesRepository";
import { AdjustStockInteractor } from "../../../core/interactors/inventory/AdjustStockInteractor";
import { ListInventoryMovementsInteractor } from "../../../core/interactors/inventory/ListInventoryMovementsInteractor";
import { ListProductStockByWarehouseInteractor } from "../../../core/interactors/inventory/ListProductStockByWarehouseInteractor";
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
      provide: ListProductStockByWarehouseInteractor,
      useFactory: (productStockRepository: IProductStockRepository) =>
        new ListProductStockByWarehouseInteractor(productStockRepository),
      inject: [PRODUCT_STOCK_REPOSITORY],
    },
    {
      provide: RestockProductInteractor,
      useFactory: (
        productsRepository: IProductsRepository,
        productStockRepository: IProductStockRepository,
        warehousesRepository: IWarehousesRepository,
        inventoryMovementsRepository: IInventoryMovementsRepository,
      ) =>
        new RestockProductInteractor(
          productsRepository,
          productStockRepository,
          warehousesRepository,
          inventoryMovementsRepository,
        ),
      inject: [
        PRODUCTS_REPOSITORY,
        PRODUCT_STOCK_REPOSITORY,
        WAREHOUSES_REPOSITORY,
        INVENTORY_MOVEMENTS_REPOSITORY,
      ],
    },
    {
      provide: RecordGiftInteractor,
      useFactory: (
        productsRepository: IProductsRepository,
        productStockRepository: IProductStockRepository,
        warehousesRepository: IWarehousesRepository,
        inventoryMovementsRepository: IInventoryMovementsRepository,
      ) =>
        new RecordGiftInteractor(
          productsRepository,
          productStockRepository,
          warehousesRepository,
          inventoryMovementsRepository,
        ),
      inject: [
        PRODUCTS_REPOSITORY,
        PRODUCT_STOCK_REPOSITORY,
        WAREHOUSES_REPOSITORY,
        INVENTORY_MOVEMENTS_REPOSITORY,
      ],
    },
    {
      provide: AdjustStockInteractor,
      useFactory: (
        productsRepository: IProductsRepository,
        productStockRepository: IProductStockRepository,
        warehousesRepository: IWarehousesRepository,
        inventoryMovementsRepository: IInventoryMovementsRepository,
      ) =>
        new AdjustStockInteractor(
          productsRepository,
          productStockRepository,
          warehousesRepository,
          inventoryMovementsRepository,
        ),
      inject: [
        PRODUCTS_REPOSITORY,
        PRODUCT_STOCK_REPOSITORY,
        WAREHOUSES_REPOSITORY,
        INVENTORY_MOVEMENTS_REPOSITORY,
      ],
    },
    CheckoutInternalGuard,
    InventoryService,
  ],
})
export class InventoryModule {}
