import { Injectable } from "@nestjs/common";
import { IFullargGateway } from "../../../core/adapters/services/fullarg/IFullargGateway";
import {
  CreateFullargOrderInput,
  CreatedFullargOrder,
} from "../../../core/entities/fullarg/FullargOrder";
import { env } from "../../../config/env";

const CREATE_ORDER_PATH = "/api/method/wms_3pl.api.public_v1.create_order";

/** Contenido de create_order (docs: https://app.fullarg.com/assets/wms_3pl/help/integraciones/api-mcp.html). */
interface FullargCreateOrderResult {
  ok?: number;
  created?: boolean;
  already_exists?: boolean;
  idempotent_replay?: boolean;
  sales_order?: string;
  status?: string;
  error?: { code?: string; message?: string };
}

/**
 * La API es un backend Frappe: todo viene envuelto en `message`
 * (`{"message": {"ok": 1, "sales_order": ...}}`, y los errores como
 * `{"message": {"error": {...}}, "exc_type": ...}`).
 */
interface FullargEnvelope extends FullargCreateOrderResult {
  message?: FullargCreateOrderResult;
}

@Injectable()
export class FullargGateway implements IFullargGateway {
  async createOrder(
    input: CreateFullargOrderInput,
  ): Promise<CreatedFullargOrder> {
    if (!env.fullargApiKey) {
      throw new Error("Fullarg no está configurado (falta FULLARG_API_KEY).");
    }

    const response = await fetch(`${env.fullargBaseUrl}${CREATE_ORDER_PATH}`, {
      method: "POST",
      headers: {
        "X-API-Key": env.fullargApiKey,
        "Idempotency-Key": input.idempotencyKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        external_order_id: input.externalOrderId,
        items: [{ sku: input.sku, qty: input.quantity }],
        ...(input.shippingMethod
          ? { shipping_method: input.shippingMethod }
          : {}),
        buyer: {
          name: input.buyer.name,
          email: input.buyer.email,
          phone: input.buyer.phone,
        },
        shipping: {
          address: input.shipping.address,
          city: input.shipping.city,
          state: input.shipping.state,
          postal_code: input.shipping.postalCode,
          country: "AR",
        },
      }),
    });

    const text = await response.text();
    let data: FullargCreateOrderResult = {};

    try {
      const parsed = text ? (JSON.parse(text) as FullargEnvelope) : {};
      data = parsed.message ?? parsed;
    } catch {
      // Respuesta no-JSON (ej. página de error): se reporta abajo con el texto crudo.
    }

    if (!response.ok || !data.sales_order) {
      const detail = data.error?.message ?? (text.slice(0, 500) || "sin detalle");
      throw new Error(
        `Fullarg rechazó el envío (${response.status}${
          data.error?.code ? ` ${data.error.code}` : ""
        }): ${detail}`,
      );
    }

    return {
      salesOrder: data.sales_order,
      status: data.status ?? "Approved",
      alreadyExisted:
        data.created === false ||
        data.already_exists === true ||
        data.idempotent_replay === true,
    };
  }
}
