import { Injectable, UnauthorizedException } from "@nestjs/common";
import {
  ProcessFullargWebhookInput,
  ProcessFullargWebhookInteractor,
} from "../../../core/interactors/webhooks/ProcessFullargWebhookInteractor";
import { env } from "../../../config/env";
import { ApiErrorCode, apiError } from "../../errors/ApiErrorResponse";
import { isValidFullargSignature } from "../fullarg/fullargSignature";

export interface FullargWebhookRequest extends ProcessFullargWebhookInput {
  signature: string | undefined;
  timestamp: string | undefined;
  rawBody: Buffer | undefined;
}

@Injectable()
export class FullargWebhookService {
  constructor(
    private readonly processFullargWebhookInteractor: ProcessFullargWebhookInteractor,
  ) {}

  async process(request: FullargWebhookRequest): Promise<void> {
    // Sin secret configurado el endpoint quedaría abierto a cualquiera que
    // sepa la URL (podría marcar órdenes como enviadas): se rechaza todo.
    const valid = isValidFullargSignature({
      secret: env.fullargWebhookSecret,
      signature: request.signature,
      timestamp: request.timestamp,
      rawBody: request.rawBody,
    });

    if (!valid) {
      throw new UnauthorizedException(
        apiError(
          ApiErrorCode.invalidWebhookSignature,
          "Firma del webhook de Fullarg inválida.",
        ),
      );
    }

    await this.processFullargWebhookInteractor.execute({
      event: request.event,
      eventId: request.eventId,
      body: request.body,
    });
  }
}
