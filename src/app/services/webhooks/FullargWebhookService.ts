import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
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
  private readonly logger = new Logger(FullargWebhookService.name);

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
      this.logger.warn(
        `Webhook de Fullarg rechazado por firma inválida (evento=${request.event ?? "?"}, id=${request.eventId ?? "?"}). Revisá FULLARG_WEBHOOK_SECRET.`,
      );
      throw new UnauthorizedException(
        apiError(
          ApiErrorCode.invalidWebhookSignature,
          "Firma del webhook de Fullarg inválida.",
        ),
      );
    }

    const { matched } = await this.processFullargWebhookInteractor.execute({
      event: request.event,
      eventId: request.eventId,
      body: request.body,
    });

    // Un evento que no matchea ninguna orden se descarta sin error; lo dejamos
    // a la vista con los nombres de campo que mandó Fullarg para poder ajustarlos.
    const body: unknown = request.body;
    const keys =
      body && typeof body === "object" ? Object.keys(body).join(",") : "";
    if (matched) {
      this.logger.log(
        `Webhook de Fullarg aplicado (evento=${request.event ?? "?"}, id=${request.eventId ?? "?"})`,
      );
    } else {
      this.logger.warn(
        `Webhook de Fullarg sin orden asociada (evento=${request.event ?? "?"}, id=${request.eventId ?? "?"}, campos=[${keys}])`,
      );
    }
  }
}
