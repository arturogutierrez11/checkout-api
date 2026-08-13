import { Controller, Get, Headers, Post, Query, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { MercadoPagoWebhookService } from "../../services/webhooks/MercadoPagoWebhookService";

interface MercadoPagoWebhookBody {
  type?: string;
  data?: { id?: string };
}

@ApiTags("webhooks")
@Controller("webhooks/mercadopago")
export class MercadoPagoWebhookController {
  constructor(
    private readonly mercadoPagoWebhookService: MercadoPagoWebhookService,
  ) {}

  @Post()
  @ApiOperation({ summary: "Mercado Pago payment notification" })
  async handlePost(
    @Req() request: Request,
    @Query("type") queryType: string | undefined,
    @Query("data.id") queryDataId: string | undefined,
    @Query("id") queryId: string | undefined,
    @Headers("x-signature") xSignature: string | undefined,
    @Headers("x-request-id") xRequestId: string | undefined,
  ): Promise<{ ok: true }> {
    const body = (request.body ?? {}) as MercadoPagoWebhookBody;

    await this.mercadoPagoWebhookService.process({
      type: body.type ?? queryType,
      paymentId: body.data?.id ?? queryDataId ?? queryId,
      xSignature: xSignature ?? null,
      xRequestId: xRequestId ?? null,
    });

    return { ok: true };
  }

  @Get()
  @ApiOperation({ summary: "Mercado Pago occasionally pings via GET" })
  async handleGet(
    @Query("type") queryType: string | undefined,
    @Query("data.id") queryDataId: string | undefined,
    @Query("id") queryId: string | undefined,
    @Headers("x-signature") xSignature: string | undefined,
    @Headers("x-request-id") xRequestId: string | undefined,
  ): Promise<{ ok: true }> {
    await this.mercadoPagoWebhookService.process({
      type: queryType,
      paymentId: queryDataId ?? queryId,
      xSignature: xSignature ?? null,
      xRequestId: xRequestId ?? null,
    });

    return { ok: true };
  }
}
