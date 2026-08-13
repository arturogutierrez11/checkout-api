import { Module } from "@nestjs/common";
import {
  ORDER_EVENTS_REPOSITORY,
  IOrderEventsRepository,
} from "../../../core/adapters/repositories/orderEvents/IOrderEventsRepository";
import {
  ORDERS_REPOSITORY,
  IOrdersRepository,
} from "../../../core/adapters/repositories/orders/IOrdersRepository";
import {
  MERCADO_PAGO_GATEWAY,
  IMercadoPagoGateway,
} from "../../../core/adapters/services/mercadoPago/IMercadoPagoGateway";
import {
  ORDER_EMAIL_SENDER,
  IOrderEmailSender,
} from "../../../core/adapters/services/orderEmail/IOrderEmailSender";
import { ProcessMercadoPagoWebhookInteractor } from "../../../core/interactors/webhooks/ProcessMercadoPagoWebhookInteractor";
import { MercadoPagoWebhookController } from "../../controllers/webhooks/MercadoPagoWebhookController";
import { MercadoPagoWebhookService } from "../../services/webhooks/MercadoPagoWebhookService";

@Module({
  controllers: [MercadoPagoWebhookController],
  providers: [
    {
      provide: ProcessMercadoPagoWebhookInteractor,
      useFactory: (
        mercadoPagoGateway: IMercadoPagoGateway,
        ordersRepository: IOrdersRepository,
        orderEventsRepository: IOrderEventsRepository,
        orderEmailSender: IOrderEmailSender,
      ) =>
        new ProcessMercadoPagoWebhookInteractor(
          mercadoPagoGateway,
          ordersRepository,
          orderEventsRepository,
          orderEmailSender,
        ),
      inject: [
        MERCADO_PAGO_GATEWAY,
        ORDERS_REPOSITORY,
        ORDER_EVENTS_REPOSITORY,
        ORDER_EMAIL_SENDER,
      ],
    },
    MercadoPagoWebhookService,
  ],
})
export class MercadoPagoWebhookModule {}
