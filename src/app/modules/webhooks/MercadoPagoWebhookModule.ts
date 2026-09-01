import { Module } from "@nestjs/common";
import {
  INVENTORY_MOVEMENTS_REPOSITORY,
  IInventoryMovementsRepository,
} from "../../../core/adapters/repositories/inventoryMovements/IInventoryMovementsRepository";
import {
  ORDER_EVENTS_REPOSITORY,
  IOrderEventsRepository,
} from "../../../core/adapters/repositories/orderEvents/IOrderEventsRepository";
import {
  ORDERS_REPOSITORY,
  IOrdersRepository,
} from "../../../core/adapters/repositories/orders/IOrdersRepository";
import {
  PRODUCT_STOCK_REPOSITORY,
  IProductStockRepository,
} from "../../../core/adapters/repositories/productStock/IProductStockRepository";
import {
  MERCADO_PAGO_GATEWAY,
  IMercadoPagoGateway,
} from "../../../core/adapters/services/mercadoPago/IMercadoPagoGateway";
import {
  META_CONVERSIONS_GATEWAY,
  IMetaConversionsGateway,
} from "../../../core/adapters/services/metaConversions/IMetaConversionsGateway";
import {
  ORDER_EMAIL_SENDER,
  IOrderEmailSender,
} from "../../../core/adapters/services/orderEmail/IOrderEmailSender";
import { ReleaseOrderStockInteractor } from "../../../core/interactors/inventory/ReleaseOrderStockInteractor";
import { ApplyMercadoPagoPaymentToOrderInteractor } from "../../../core/interactors/orders/ApplyMercadoPagoPaymentToOrderInteractor";
import { ProcessMercadoPagoWebhookInteractor } from "../../../core/interactors/webhooks/ProcessMercadoPagoWebhookInteractor";
import { MercadoPagoWebhookController } from "../../controllers/webhooks/MercadoPagoWebhookController";
import { MercadoPagoWebhookService } from "../../services/webhooks/MercadoPagoWebhookService";

@Module({
  controllers: [MercadoPagoWebhookController],
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
        metaConversionsGateway: IMetaConversionsGateway,
      ) =>
        new ApplyMercadoPagoPaymentToOrderInteractor(
          ordersRepository,
          orderEventsRepository,
          orderEmailSender,
          releaseOrderStockInteractor,
          metaConversionsGateway,
        ),
      inject: [
        ORDERS_REPOSITORY,
        ORDER_EVENTS_REPOSITORY,
        ORDER_EMAIL_SENDER,
        ReleaseOrderStockInteractor,
        META_CONVERSIONS_GATEWAY,
      ],
    },
    {
      provide: ProcessMercadoPagoWebhookInteractor,
      useFactory: (
        mercadoPagoGateway: IMercadoPagoGateway,
        ordersRepository: IOrdersRepository,
        applyMercadoPagoPaymentToOrderInteractor: ApplyMercadoPagoPaymentToOrderInteractor,
      ) =>
        new ProcessMercadoPagoWebhookInteractor(
          mercadoPagoGateway,
          ordersRepository,
          applyMercadoPagoPaymentToOrderInteractor,
        ),
      inject: [
        MERCADO_PAGO_GATEWAY,
        ORDERS_REPOSITORY,
        ApplyMercadoPagoPaymentToOrderInteractor,
      ],
    },
    MercadoPagoWebhookService,
  ],
})
export class MercadoPagoWebhookModule {}
