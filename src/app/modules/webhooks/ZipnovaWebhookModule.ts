import { Module } from "@nestjs/common";
import {
  IOrdersRepository,
  ORDERS_REPOSITORY,
} from "../../../core/adapters/repositories/orders/IOrdersRepository";
import { ProcessZipnovaWebhookInteractor } from "../../../core/interactors/webhooks/ProcessZipnovaWebhookInteractor";
import { ZipnovaWebhookController } from "../../controllers/webhooks/ZipnovaWebhookController";
import { ZipnovaWebhookService } from "../../services/webhooks/ZipnovaWebhookService";

@Module({
  controllers: [ZipnovaWebhookController],
  providers: [
    {
      provide: ProcessZipnovaWebhookInteractor,
      useFactory: (ordersRepository: IOrdersRepository) =>
        new ProcessZipnovaWebhookInteractor(ordersRepository),
      inject: [ORDERS_REPOSITORY],
    },
    ZipnovaWebhookService,
  ],
})
export class ZipnovaWebhookModule {}
