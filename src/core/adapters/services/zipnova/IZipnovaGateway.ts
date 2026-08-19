import {
  CreateZipnovaShipmentInput,
  CreatedZipnovaShipment,
  QuoteShipmentInput,
  ZipnovaLabel,
  ZipnovaQuoteAlternative,
} from "../../../entities/zipnova/ZipnovaShipment";

export const ZIPNOVA_GATEWAY = Symbol("ZIPNOVA_GATEWAY");

export interface IZipnovaGateway {
  quoteShipment(input: QuoteShipmentInput): Promise<ZipnovaQuoteAlternative[]>;
  createShipment(
    input: CreateZipnovaShipmentInput,
  ): Promise<CreatedZipnovaShipment>;
  downloadLabel(shipmentId: number): Promise<ZipnovaLabel>;
}
