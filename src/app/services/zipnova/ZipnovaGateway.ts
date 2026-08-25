import { Injectable } from "@nestjs/common";
import { IZipnovaGateway } from "../../../core/adapters/services/zipnova/IZipnovaGateway";
import {
  CARD_HEIGHT_CM,
  CARD_LENGTH_CM,
  CARD_WEIGHT_GRAMS,
  CARD_WIDTH_CM,
} from "../../../core/entities/products/Product";
import {
  CreateOriginAddressInput,
  CreateZipnovaShipmentInput,
  CreatedZipnovaOriginAddress,
  CreatedZipnovaShipment,
  QuoteShipmentInput,
  ZipnovaLabel,
  ZipnovaQuoteAlternative,
} from "../../../core/entities/zipnova/ZipnovaShipment";
import { env } from "../../../config/env";

interface ZipnovaQuoteAmounts {
  price_incl_tax: number;
}

interface ZipnovaQuoteResultItem {
  carrier: { id: number; name: string };
  service_type: { code: string };
  logistic_type: string;
  amounts: ZipnovaQuoteAmounts;
  delivery_time?: { estimated_delivery?: string | null };
}

interface ZipnovaQuoteResponse {
  all_results: ZipnovaQuoteResultItem[];
}

interface ZipnovaShipmentResponse {
  id: number;
  tracking: string | null;
  carrier_tracking_id: string | null;
  price_incl_tax: number;
}

function requiredConfig(): {
  accountId: number;
} {
  if (!env.zipnovaApiToken || !env.zipnovaApiSecret || !env.zipnovaAccountId) {
    throw new Error(
      "Zipnova no está configurado (faltan ZIPNOVA_API_TOKEN/API_SECRET/ACCOUNT_ID).",
    );
  }

  return { accountId: Number(env.zipnovaAccountId) };
}

function buildItems(cardUnits: number) {
  return Array.from({ length: cardUnits }, () => ({
    sku: "TARJETA0001",
    description: "Tarjeta rituo NFC + packaging",
    weight: CARD_WEIGHT_GRAMS,
    length: CARD_LENGTH_CM,
    width: CARD_WIDTH_CM,
    height: CARD_HEIGHT_CM,
    classification_id: 1,
  }));
}

function authHeader(): string {
  const credentials = Buffer.from(
    `${env.zipnovaApiToken}:${env.zipnovaApiSecret}`,
  ).toString("base64");
  return `Basic ${credentials}`;
}

@Injectable()
export class ZipnovaGateway implements IZipnovaGateway {
  async quoteShipment(
    input: QuoteShipmentInput,
  ): Promise<ZipnovaQuoteAlternative[]> {
    const { accountId } = requiredConfig();

    const response = await fetch(`${env.zipnovaBaseUrl}/shipments/quote`, {
      method: "POST",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        account_id: accountId,
        origin_id: input.originId,
        declared_value: input.declaredValue,
        destination: {
          city: input.destination.city,
          state: input.destination.state,
          zipcode: input.destination.zipcode,
          country: "AR",
        },
        items: buildItems(input.cardUnits),
        type_packaging: "dynamic",
        source: "rituo-checkout-api",
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(
        `Zipnova rechazó la cotización (${response.status}): ${detail}`,
      );
    }

    const data = (await response.json()) as ZipnovaQuoteResponse;

    return data.all_results.map((result) => ({
      carrierId: result.carrier.id,
      carrierName: result.carrier.name,
      serviceType: result.service_type.code,
      logisticType: result.logistic_type,
      price: result.amounts.price_incl_tax,
      estimatedDelivery: result.delivery_time?.estimated_delivery ?? null,
    }));
  }

  async createShipment(
    input: CreateZipnovaShipmentInput,
  ): Promise<CreatedZipnovaShipment> {
    const { accountId } = requiredConfig();

    const response = await fetch(`${env.zipnovaBaseUrl}/shipments`, {
      method: "POST",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        account_id: accountId,
        origin_id: input.originId,
        carrier_id: input.carrierId,
        logistic_type: input.logisticType,
        service_type: input.serviceType,
        source: "rituo-checkout-api",
        declared_value: input.declaredValue,
        external_id: input.externalId,
        destination: {
          name: input.destination.name,
          street: input.destination.street,
          street_number: input.destination.streetNumber,
          document: input.destination.document,
          email: input.destination.email,
          phone: input.destination.phone,
          state: input.destination.state,
          city: input.destination.city,
          zipcode: input.destination.zipcode,
          country: "AR",
        },
        items: buildItems(input.cardUnits),
        type_packaging: "dynamic",
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(
        `Zipnova rechazó la creación del envío (${response.status}): ${detail}`,
      );
    }

    const data = (await response.json()) as ZipnovaShipmentResponse;

    return {
      id: data.id,
      trackingNumber: data.tracking ?? data.carrier_tracking_id ?? null,
      price: data.price_incl_tax,
    };
  }

  async downloadLabel(shipmentId: number): Promise<ZipnovaLabel> {
    const url = new URL(
      `${env.zipnovaBaseUrl}/shipments/${shipmentId}/documentation`,
    );
    url.searchParams.set("what", "label");
    url.searchParams.set("format", "pdf");

    const response = await fetch(url, {
      headers: { Authorization: authHeader() },
    });

    if (response.status === 409) {
      throw new Error(
        "La etiqueta todavía se está generando en Zipnova. Probá de nuevo en unos segundos.",
      );
    }

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(
        `Zipnova rechazó la descarga de la etiqueta (${response.status}): ${detail}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();

    return {
      buffer: Buffer.from(arrayBuffer),
      contentType: response.headers.get("content-type") ?? "application/pdf",
    };
  }

  async createOriginAddress(
    input: CreateOriginAddressInput,
  ): Promise<CreatedZipnovaOriginAddress> {
    const { accountId } = requiredConfig();

    const response = await fetch(`${env.zipnovaBaseUrl}/addresses`, {
      method: "POST",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        account_id: accountId,
        name: input.name,
        street: input.street,
        street_number: input.streetNumber,
        city: input.city,
        state: input.state,
        zipcode: input.zipcode,
        phone: input.phone,
        email: input.email,
        country: "AR",
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(
        `Zipnova rechazó la creación del depósito (${response.status}): ${detail}`,
      );
    }

    const data = (await response.json()) as { id: number };

    return { id: data.id };
  }
}
