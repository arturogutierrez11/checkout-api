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
  IOrderEmailSender,
  ORDER_EMAIL_SENDER,
} from "../../../core/adapters/services/orderEmail/IOrderEmailSender";
import { ProcessFullargWebhookInteractor } from "../../../core/interactors/webhooks/ProcessFullargWebhookInteractor";
import { FullargWebhookController } from "../../controllers/webhooks/FullargWebhookController";
import { FullargWebhookService } from "../../services/webhooks/FullargWebhookService";

@Module({
  controllers: [FullargWebhookController],
  providers: [
    {
      provide: ProcessFullargWebhookInteractor,
      useFactory: (
        ordersRepository: IOrdersRepository,
        orderEventsRepository: IOrderEventsRepository,
        orderEmailSender: IOrderEmailSender,
      ) =>
        new ProcessFullargWebhookInteractor(
          ordersRepository,
          orderEventsRepository,
          orderEmailSender,
        ),
      inject: [ORDERS_REPOSITORY, ORDER_EVENTS_REPOSITORY, ORDER_EMAIL_SENDER],
    },
    FullargWebhookService,
  ],
})
export class FullargWebhookModule {}
