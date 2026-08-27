import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { env } from "../../../config/env";
import { INVENTORY_MOVEMENTS_REPOSITORY } from "../../../core/adapters/repositories/inventoryMovements/IInventoryMovementsRepository";
import { ORDER_EVENTS_REPOSITORY } from "../../../core/adapters/repositories/orderEvents/IOrderEventsRepository";
import { ORDERS_REPOSITORY } from "../../../core/adapters/repositories/orders/IOrdersRepository";
import { PRODUCT_STOCK_REPOSITORY } from "../../../core/adapters/repositories/productStock/IProductStockRepository";
import { PRODUCTS_REPOSITORY } from "../../../core/adapters/repositories/products/IProductsRepository";
import { WAREHOUSES_REPOSITORY } from "../../../core/adapters/repositories/warehouses/IWarehousesRepository";
import { SQLInventoryMovementsRepository } from "../../drivers/repositories/inventoryMovements/SQLInventoryMovementsRepository";
import { SQLOrderEventsRepository } from "../../drivers/repositories/orderEvents/SQLOrderEventsRepository";
import { SQLOrdersRepository } from "../../drivers/repositories/orders/SQLOrdersRepository";
import { SQLProductStockRepository } from "../../drivers/repositories/productStock/SQLProductStockRepository";
import { SQLProductsRepository } from "../../drivers/repositories/products/SQLProductsRepository";
import { SQLWarehousesRepository } from "../../drivers/repositories/warehouses/SQLWarehousesRepository";

@Global()
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      url: env.databaseUrl,
      synchronize: false,
      entities: [],
    }),
  ],
  providers: [
    { provide: PRODUCTS_REPOSITORY, useClass: SQLProductsRepository },
    { provide: ORDERS_REPOSITORY, useClass: SQLOrdersRepository },
    { provide: ORDER_EVENTS_REPOSITORY, useClass: SQLOrderEventsRepository },
    {
      provide: INVENTORY_MOVEMENTS_REPOSITORY,
      useClass: SQLInventoryMovementsRepository,
    },
    { provide: WAREHOUSES_REPOSITORY, useClass: SQLWarehousesRepository },
    {
      provide: PRODUCT_STOCK_REPOSITORY,
      useClass: SQLProductStockRepository,
    },
  ],
  exports: [
    PRODUCTS_REPOSITORY,
    ORDERS_REPOSITORY,
    ORDER_EVENTS_REPOSITORY,
    INVENTORY_MOVEMENTS_REPOSITORY,
    WAREHOUSES_REPOSITORY,
    PRODUCT_STOCK_REPOSITORY,
  ],
})
export class DatabaseModule {}
