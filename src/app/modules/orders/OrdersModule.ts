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
import { CreateOrderInteractor } from "../../../core/interactors/orders/CreateOrderInteractor";
import { GetOrderInteractor } from "../../../core/interactors/orders/GetOrderInteractor";
import { ListOrdersInteractor } from "../../../core/interactors/orders/ListOrdersInteractor";
import { OrdersController } from "../../controllers/orders/OrdersController";
import { CheckoutInternalGuard } from "../../services/checkoutInternalAuth/guards/CheckoutInternalGuard";
import { OrdersService } from "../../services/orders/OrdersService";

@Module({
  controllers: [OrdersController],
  providers: [
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
    CheckoutInternalGuard,
    OrdersService,
  ],
  exports: [OrdersService],
})
export class OrdersModule {}
