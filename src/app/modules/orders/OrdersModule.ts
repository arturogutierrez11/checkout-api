import { Module } from "@nestjs/common";
import {
  IOrderEventsRepository,
  ORDER_EVENTS_REPOSITORY,
} from "../../../core/adapters/repositories/orderEvents/IOrderEventsRepository";
import {
  IOrdersRepository,
  ORDERS_REPOSITORY,
} from "../../../core/adapters/repositories/orders/IOrdersRepository";
import {
  IProductsRepository,
  PRODUCTS_REPOSITORY,
} from "../../../core/adapters/repositories/products/IProductsRepository";
import {
  IMercadoPagoGateway,
  MERCADO_PAGO_GATEWAY,
} from "../../../core/adapters/services/mercadoPago/IMercadoPagoGateway";
import {
  IOrderEmailSender,
  ORDER_EMAIL_SENDER,
} from "../../../core/adapters/services/orderEmail/IOrderEmailSender";
import { ApplyMercadoPagoPaymentToOrderInteractor } from "../../../core/interactors/orders/ApplyMercadoPagoPaymentToOrderInteractor";
import { CancelOrderInteractor } from "../../../core/interactors/orders/CancelOrderInteractor";
import { CreateOrderInteractor } from "../../../core/interactors/orders/CreateOrderInteractor";
import { GetOrderInteractor } from "../../../core/interactors/orders/GetOrderInteractor";
import { ListOrdersInteractor } from "../../../core/interactors/orders/ListOrdersInteractor";
import { MarkOrderShippedInteractor } from "../../../core/interactors/orders/MarkOrderShippedInteractor";
import { ResyncOrderInteractor } from "../../../core/interactors/orders/ResyncOrderInteractor";
import { SetInvoiceStatusInteractor } from "../../../core/interactors/orders/SetInvoiceStatusInteractor";
import { SetShippingStatusInteractor } from "../../../core/interactors/orders/SetShippingStatusInteractor";
import { OrdersController } from "../../controllers/orders/OrdersController";
import { CheckoutInternalGuard } from "../../services/checkoutInternalAuth/guards/CheckoutInternalGuard";
import { OrdersService } from "../../services/orders/OrdersService";

@Module({
  controllers: [OrdersController],
  providers: [
    {
      provide: ApplyMercadoPagoPaymentToOrderInteractor,
      useFactory: (
        ordersRepository: IOrdersRepository,
        orderEventsRepository: IOrderEventsRepository,
        orderEmailSender: IOrderEmailSender,
      ) =>
        new ApplyMercadoPagoPaymentToOrderInteractor(
          ordersRepository,
          orderEventsRepository,
          orderEmailSender,
        ),
      inject: [ORDERS_REPOSITORY, ORDER_EVENTS_REPOSITORY, ORDER_EMAIL_SENDER],
    },
    {
      provide: CreateOrderInteractor,
      useFactory: (
        productsRepository: IProductsRepository,
        ordersRepository: IOrdersRepository,
        orderEventsRepository: IOrderEventsRepository,
        mercadoPagoGateway: IMercadoPagoGateway,
      ) =>
        new CreateOrderInteractor(
          productsRepository,
          ordersRepository,
          orderEventsRepository,
          mercadoPagoGateway,
        ),
      inject: [
        PRODUCTS_REPOSITORY,
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
        productsRepository: IProductsRepository,
        orderEventsRepository: IOrderEventsRepository,
      ) =>
        new CancelOrderInteractor(
          ordersRepository,
          productsRepository,
          orderEventsRepository,
        ),
      inject: [ORDERS_REPOSITORY, PRODUCTS_REPOSITORY, ORDER_EVENTS_REPOSITORY],
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
