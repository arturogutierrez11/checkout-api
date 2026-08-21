import { Injectable } from "@nestjs/common";
import {
  ProcessZipnovaWebhookInput,
  ProcessZipnovaWebhookInteractor,
} from "../../../core/interactors/webhooks/ProcessZipnovaWebhookInteractor";

@Injectable()
export class ZipnovaWebhookService {
  constructor(
    private readonly processZipnovaWebhookInteractor: ProcessZipnovaWebhookInteractor,
  ) {}

  process(input: ProcessZipnovaWebhookInput): Promise<void> {
    return this.processZipnovaWebhookInteractor.execute(input);
  }
}
