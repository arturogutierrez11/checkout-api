import { Injectable, UnauthorizedException } from "@nestjs/common";
import {
  ProcessMercadoPagoWebhookInteractor,
  ProcessWebhookInput,
} from "../../../core/interactors/webhooks/ProcessMercadoPagoWebhookInteractor";
import { InvalidWebhookSignatureError } from "../../../core/interactors/webhooks/InvalidWebhookSignatureError";

@Injectable()
export class MercadoPagoWebhookService {
  constructor(
    private readonly processMercadoPagoWebhookInteractor: ProcessMercadoPagoWebhookInteractor,
  ) {}

  async process(input: ProcessWebhookInput): Promise<void> {
    try {
      await this.processMercadoPagoWebhookInteractor.execute(input);
    } catch (err) {
      if (err instanceof InvalidWebhookSignatureError) {
        throw new UnauthorizedException(err.message);
      }
      throw err;
    }
  }
}
