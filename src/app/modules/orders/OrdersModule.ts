import { Module } from "@nestjs/common";
import {
  IInventoryMovementsRepository,
  INVENTORY_MOVEMENTS_REPOSITORY,
} from "../../../core/adapters/repositories/inventoryMovements/IInventoryMovementsRepository";
import {
  IOrderEventsRepository,
  ORDER_EVENTS_REPOSITORY,
} from "../../../core/adapters/repositories/orderEvents/IOrderEventsRepository";
import {
  IOrdersRepository,
  ORDERS_REPOSITORY,
} from "../../../core/adapters/repositories/orders/IOrdersRepository";
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
import {
  IMercadoPagoGateway,
  MERCADO_PAGO_GATEWAY,
} from "../../../core/adapters/services/mercadoPago/IMercadoPagoGateway";
import {
  IOrderEmailSender,
  ORDER_EMAIL_SENDER,
} from "../../../core/adapters/services/orderEmail/IOrderEmailSender";
import {
  IZipnovaGateway,
  ZIPNOVA_GATEWAY,
} from "../../../core/adapters/services/zipnova/IZipnovaGateway";
import { ReleaseOrderStockInteractor } from "../../../core/interactors/inventory/ReleaseOrderStockInteractor";
import { ApplyMercadoPagoPaymentToOrderInteractor } from "../../../core/interactors/orders/ApplyMercadoPagoPaymentToOrderInteractor";
import { CancelOrderInteractor } from "../../../core/interactors/orders/CancelOrderInteractor";
import { CreateOrderInteractor } from "../../../core/interactors/orders/CreateOrderInteractor";
import { DownloadShippingLabelInteractor } from "../../../core/interactors/orders/DownloadShippingLabelInteractor";
import { GenerateShippingLabelInteractor } from "../../../core/interactors/orders/GenerateShippingLabelInteractor";
import { GetOrderInteractor } from "../../../core/interactors/orders/GetOrderInteractor";
import { ListOrdersInteractor } from "../../../core/interactors/orders/ListOrdersInteractor";
import { MarkOrderShippedInteractor } from "../../../core/interactors/orders/MarkOrderShippedInteractor";
import { ResyncOrderInteractor } from "../../../core/interactors/orders/ResyncOrderInteractor";
import { ReturnOrderInteractor } from "../../../core/interactors/orders/ReturnOrderInteractor";
import { SetInvoiceStatusInteractor } from "../../../core/interactors/orders/SetInvoiceStatusInteractor";
import { SetShippingStatusInteractor } from "../../../core/interactors/orders/SetShippingStatusInteractor";
import { OrdersController } from "../../controllers/orders/OrdersController";
import { CheckoutInternalGuard } from "../../services/checkoutInternalAuth/guards/CheckoutInternalGuard";
import { OrdersService } from "../../services/orders/OrdersService";
import { ZipnovaGateway } from "../../services/zipnova/ZipnovaGateway";

@Module({
  controllers: [OrdersController],
  providers: [
    {
      provide: ReleaseOrderStockInteractor,
      useFactory: (
        inventoryMovementsRepository: IInventoryMovementsRepository,
        productStockRepository: IProductStockRepository,
      ) =>
        new ReleaseOrderStockInteractor(
          inventoryMovementsRepository,
          productStockRepository,
        ),
      inject: [INVENTORY_MOVEMENTS_REPOSITORY, PRODUCT_STOCK_REPOSITORY],
    },
    {
      provide: ApplyMercadoPagoPaymentToOrderInteractor,
      useFactory: (
        ordersRepository: IOrdersRepository,
        orderEventsRepository: IOrderEventsRepository,
        orderEmailSender: IOrderEmailSender,
        releaseOrderStockInteractor: ReleaseOrderStockInteractor,
      ) =>
        new ApplyMercadoPagoPaymentToOrderInteractor(
          ordersRepository,
          orderEventsRepository,
          orderEmailSender,
          releaseOrderStockInteractor,
        ),
      inject: [
        ORDERS_REPOSITORY,
        ORDER_EVENTS_REPOSITORY,
        ORDER_EMAIL_SENDER,
        ReleaseOrderStockInteractor,
      ],
    },
    {
      provide: CreateOrderInteractor,
      useFactory: (
        productsRepository: IProductsRepository,
        productStockRepository: IProductStockRepository,
        ordersRepository: IOrdersRepository,
        orderEventsRepository: IOrderEventsRepository,
        mercadoPagoGateway: IMercadoPagoGateway,
      ) =>
        new CreateOrderInteractor(
          productsRepository,
          productStockRepository,
          ordersRepository,
          orderEventsRepository,
          mercadoPagoGateway,
        ),
      inject: [
        PRODUCTS_REPOSITORY,
        PRODUCT_STOCK_REPOSITORY,
        ORDERS_REPOSITORY,
        ORDER_EVENTS_REPOSITORY,
        MERCADO_PAGO_GATEWAY,
      ],
    },
    {
      provide: GetOrderInteractor,
      useFactory: (repository: IOrdersRepository) =>
        new GetOrderInteractor(repository),
      inject: [ORDERS_REPOSITORY],
    },
    {
      provide: ListOrdersInteractor,
      useFactory: (repository: IOrdersRepository) =>
        new ListOrdersInteractor(repository),
      inject: [ORDERS_REPOSITORY],
    },
    {
      provide: CancelOrderInteractor,
      useFactory: (
        ordersRepository: IOrdersRepository,
        releaseOrderStockInteractor: ReleaseOrderStockInteractor,
        orderEventsRepository: IOrderEventsRepository,
      ) =>
        new CancelOrderInteractor(
          ordersRepository,
          releaseOrderStockInteractor,
          orderEventsRepository,
        ),
      inject: [
        ORDERS_REPOSITORY,
        ReleaseOrderStockInteractor,
        ORDER_EVENTS_REPOSITORY,
      ],
    },
    {
      provide: MarkOrderShippedInteractor,
      useFactory: (
        ordersRepository: IOrdersRepository,
        orderEventsRepository: IOrderEventsRepository,
        orderEmailSender: IOrderEmailSender,
      ) =>
        new MarkOrderShippedInteractor(
          ordersRepository,
          orderEventsRepository,
          orderEmailSender,
        ),
      inject: [ORDERS_REPOSITORY, ORDER_EVENTS_REPOSITORY, ORDER_EMAIL_SENDER],
    },
    {
      provide: ZIPNOVA_GATEWAY,
      useClass: ZipnovaGateway,
    },
    {
      provide: GenerateShippingLabelInteractor,
      useFactory: (
        ordersRepository: IOrdersRepository,
        productsRepository: IProductsRepository,
        productStockRepository: IProductStockRepository,
        warehousesRepository: IWarehousesRepository,
        inventoryMovementsRepository: IInventoryMovementsRepository,
        zipnovaGateway: IZipnovaGateway,
        orderEventsRepository: IOrderEventsRepository,
      ) =>
        new GenerateShippingLabelInteractor(
          ordersRepository,
          productsRepository,
          productStockRepository,
          warehousesRepository,
          inventoryMovementsRepository,
          zipnovaGateway,
          orderEventsRepository,
        ),
      inject: [
        ORDERS_REPOSITORY,
        PRODUCTS_REPOSITORY,
        PRODUCT_STOCK_REPOSITORY,
        WAREHOUSES_REPOSITORY,
        INVENTORY_MOVEMENTS_REPOSITORY,
        ZIPNOVA_GATEWAY,
        ORDER_EVENTS_REPOSITORY,
      ],
    },
    {
      provide: DownloadShippingLabelInteractor,
      useFactory: (
        ordersRepository: IOrdersRepository,
        zipnovaGateway: IZipnovaGateway,
      ) =>
        new DownloadShippingLabelInteractor(ordersRepository, zipnovaGateway),
      inject: [ORDERS_REPOSITORY, ZIPNOVA_GATEWAY],
    },
    {
      provide: ResyncOrderInteractor,
      useFactory: (
        ordersRepository: IOrdersRepository,
        mercadoPagoGateway: IMercadoPagoGateway,
        applyMercadoPagoPaymentToOrderInteractor: ApplyMercadoPagoPaymentToOrderInteractor,
      ) =>
        new ResyncOrderInteractor(
          ordersRepository,
          mercadoPagoGateway,
          applyMercadoPagoPaymentToOrderInteractor,
        ),
      inject: [
        ORDERS_REPOSITORY,
        MERCADO_PAGO_GATEWAY,
        ApplyMercadoPagoPaymentToOrderInteractor,
      ],
    },
    {
      provide: ReturnOrderInteractor,
      useFactory: (
        ordersRepository: IOrdersRepository,
        inventoryMovementsRepository: IInventoryMovementsRepository,
        releaseOrderStockInteractor: ReleaseOrderStockInteractor,
      ) =>
        new ReturnOrderInteractor(
          ordersRepository,
          inventoryMovementsRepository,
          releaseOrderStockInteractor,
        ),
      inject: [
        ORDERS_REPOSITORY,
        INVENTORY_MOVEMENTS_REPOSITORY,
        ReleaseOrderStockInteractor,
      ],
    },
    {
      provide: SetShippingStatusInteractor,
      useFactory: (
        ordersRepository: IOrdersRepository,
        orderEventsRepository: IOrderEventsRepository,
      ) =>
        new SetShippingStatusInteractor(
          ordersRepository,
          orderEventsRepository,
        ),
      inject: [ORDERS_REPOSITORY, ORDER_EVENTS_REPOSITORY],
    },
    {
      provide: SetInvoiceStatusInteractor,
      useFactory: (
        ordersRepository: IOrdersRepository,
        orderEventsRepository: IOrderEventsRepository,
      ) =>
        new SetInvoiceStatusInteractor(ordersRepository, orderEventsRepository),
      inject: [ORDERS_REPOSITORY, ORDER_EVENTS_REPOSITORY],
    },
    CheckoutInternalGuard,
    OrdersService,
  ],
  exports: [OrdersService],
})
export class OrdersModule {}
