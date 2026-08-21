import { Body, Controller, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ZipnovaWebhookService } from "../../services/webhooks/ZipnovaWebhookService";

interface ZipnovaWebhookBody {
  topic?: string;
  data?: {
    shipment_id?: number | string;
    status?: string;
    status_code?: string;
  };
}

@ApiTags("webhooks")
@Controller("webhooks/zipnova")
export class ZipnovaWebhookController {
  constructor(private readonly zipnovaWebhookService: ZipnovaWebhookService) {}

  @Post("status")
  @ApiOperation({ summary: "Zipnova shipment status notification" })
  async handleStatus(@Body() body: ZipnovaWebhookBody): Promise<{ ok: true }> {
    await this.zipnovaWebhookService.process({
      topic: body.topic,
      shipmentId:
        body.data?.shipment_id !== undefined
          ? String(body.data.shipment_id)
          : undefined,
      statusCode: body.data?.status_code,
      statusName: body.data?.status,
    });

    return { ok: true };
  }
}
