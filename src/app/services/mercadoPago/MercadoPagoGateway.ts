import { Injectable } from "@nestjs/common";
import { createHmac } from "node:crypto";
import {
  IMercadoPagoGateway,
  MercadoPagoPayment,
  MercadoPagoPreference,
  VerifyWebhookSignatureInput,
} from "../../../core/adapters/services/mercadoPago/IMercadoPagoGateway";
import { Order } from "../../../core/entities/orders/Order";
import { env } from "../../../config/env";

const MP_API_BASE = "https://api.mercadopago.com";

function getAccessToken(): string {
  if (!env.mercadoPagoAccessToken) {
    throw new Error(
      "Mercado Pago no está configurado (falta MERCADOPAGO_ACCESS_TOKEN).",
    );
  }
  return env.mercadoPagoAccessToken;
}

@Injectable()
export class MercadoPagoGateway implements IMercadoPagoGateway {
  async createPreference(order: Order): Promise<MercadoPagoPreference> {
    const items = [
      {
        id: order.productSku,
        title: order.productName,
        quantity: order.quantity,
        unit_price: order.unitPrice,
        currency_id: order.currency,
      },
      ...(order.shippingPrice > 0
        ? [
            {
              id: "shipping",
              title: `Envío ${order.shippingMethod === "express" ? "express" : "estándar"}`,
              quantity: 1,
              unit_price: order.shippingPrice,
              currency_id: order.currency,
            },
          ]
        : []),
    ];

    const notificationUrl = env.checkoutApiPublicUrl
      ? `${env.checkoutApiPublicUrl}/webhooks/mercadopago`
      : undefined;

    const response = await fetch(`${MP_API_BASE}/checkout/preferences`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": order.id,
      },
      body: JSON.stringify({
        items,
        payer: {
          name: order.customerFirstName,
          surname: order.customerLastName,
          email: order.customerEmail,
          phone: { number: order.customerPhone },
          address: {
            street_name: order.shippingAddress,
            zip_code: order.shippingPostalCode,
          },
        },
        back_urls: {
          success: `${env.checkoutSiteUrl}/checkout/success`,
          failure: `${env.checkoutSiteUrl}/checkout/failure`,
          pending: `${env.checkoutSiteUrl}/checkout/pending`,
        },
        auto_return: "approved",
        ...(notificationUrl ? { notification_url: notificationUrl } : {}),
        external_reference: order.id,
        statement_descriptor: "RITUO",
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(
        `Mercado Pago rechazó la preferencia (${response.status}): ${detail}`,
      );
    }

    const data = (await response.json()) as {
      id: string;
      init_point: string;
    };

    return { id: data.id, initPoint: data.init_point };
  }

  async getPayment(paymentId: string): Promise<MercadoPagoPayment> {
    const response = await fetch(`${MP_API_BASE}/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(
        `No pudimos obtener el pago de Mercado Pago (${response.status}): ${detail}`,
      );
    }

    const data = (await response.json()) as {
      id: number;
      status: string;
      status_detail: string;
      external_reference: string | null;
      transaction_amount: number;
    };

    return {
      id: data.id,
      status: data.status,
      statusDetail: data.status_detail,
      externalReference: data.external_reference ?? null,
      transactionAmount: data.transaction_amount,
    };
  }

  verifyWebhookSignature(input: VerifyWebhookSignatureInput): boolean {
    const secret = env.mercadoPagoWebhookSecret;

    if (!secret) {
      return true;
    }

    if (!input.xSignature || !input.xRequestId) {
      return false;
    }

    const parts = new Map(
      input.xSignature.split(",").map((part) => {
        const [key, value] = part.split("=");
        return [key?.trim(), value?.trim()];
      }),
    );

    const ts = parts.get("ts");
    const hash = parts.get("v1");

    if (!ts || !hash) {
      return false;
    }

    const manifest = `id:${input.dataId.toLowerCase()};request-id:${input.xRequestId};ts:${ts};`;
    const expectedHash = createHmac("sha256", secret)
      .update(manifest)
      .digest("hex");

    return expectedHash === hash;
  }
}
