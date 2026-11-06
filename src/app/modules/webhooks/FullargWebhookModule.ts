import { Module } from "@nestjs/common";
import {
  IOrderEventsRepository,
  ORDER_EVENTS_REPOSITORY,
} from "../../../core/adapters/repositories/orderEvents/IOrderEventsRepository";
import {
  IOrdersRepository,
  ORDERS_REPOSITORY,
} from "../../../core/adapters/repositories/orders/IOrdersRepository";
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
      ) =>
        new ProcessFullargWebhookInteractor(
          ordersRepository,
          orderEventsRepository,
        ),
      inject: [ORDERS_REPOSITORY, ORDER_EVENTS_REPOSITORY],
    },
    FullargWebhookService,
  ],
})
export class FullargWebhookModule {}
