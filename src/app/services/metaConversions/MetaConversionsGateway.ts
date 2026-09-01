import { Injectable } from "@nestjs/common";
import { createHash } from "node:crypto";
import { IMetaConversionsGateway } from "../../../core/adapters/services/metaConversions/IMetaConversionsGateway";
import { Order } from "../../../core/entities/orders/Order";
import { env } from "../../../config/env";

const GRAPH_API_BASE = "https://graph.facebook.com/v21.0";

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function hashEmail(email: string): string {
  return sha256Hex(email.trim().toLowerCase());
}

function hashPhone(phone: string): string {
  return sha256Hex(phone.replace(/\D/g, ""));
}

@Injectable()
export class MetaConversionsGateway implements IMetaConversionsGateway {
  async sendPurchaseEvent(order: Order): Promise<void> {
    if (!env.metaPixelId || !env.metaAccessToken) {
      throw new Error(
        "Meta Conversions API no está configurada (falta META_PIXEL_ID o META_ACCESS_TOKEN).",
      );
    }

    const url = new URL(`${GRAPH_API_BASE}/${env.metaPixelId}/events`);
    url.searchParams.set("access_token", env.metaAccessToken);

    const eventTimeSeconds = Math.floor(
      (order.approvedAt ?? new Date()).getTime() / 1000,
    );

    const payload = {
      data: [
        {
          event_name: "Purchase",
          event_time: eventTimeSeconds,
          event_id: order.id,
          action_source: "website",
          event_source_url: `${env.checkoutSiteUrl}/checkout?product=${order.productSku}`,
          user_data: {
            em: [hashEmail(order.customerEmail)],
            ph: [hashPhone(order.customerPhone)],
            client_ip_address: order.clientIpAddress ?? undefined,
            client_user_agent: order.clientUserAgent ?? undefined,
            fbp: order.fbp ?? undefined,
            fbc: order.fbc ?? undefined,
          },
          custom_data: {
            currency: order.currency,
            value: order.total,
            content_ids: [order.productSku],
            content_type: "product",
            num_items: order.quantity,
          },
        },
      ],
      ...(env.metaTestEventCode
        ? { test_event_code: env.metaTestEventCode }
        : {}),
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(
        `Meta Conversions API rechazó el evento (${response.status}): ${detail}`,
      );
    }
  }
}
