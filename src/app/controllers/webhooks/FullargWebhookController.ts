import { Controller, Headers, Post, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { FullargWebhookService } from "../../services/webhooks/FullargWebhookService";

@ApiTags("webhooks")
@Controller("webhooks/fullarg")
export class FullargWebhookController {
  constructor(private readonly fullargWebhookService: FullargWebhookService) {}

  @Post()
  @ApiOperation({ summary: "Fullarg (3PL) event notification" })
  async handle(
    @Req() request: Request & { rawBody?: Buffer },
    @Headers("x-3pl-event") event: string | undefined,
    @Headers("x-3pl-event-id") eventId: string | undefined,
    @Headers("x-3pl-timestamp") timestamp: string | undefined,
    @Headers("x-3pl-signature") signature: string | undefined,
  ): Promise<{ ok: true }> {
    await this.fullargWebhookService.process({
      event,
      eventId,
      timestamp,
      signature,
      rawBody: request.rawBody,
      body: request.body,
    });

    return { ok: true };
  }
}
