import { IOrdersRepository } from "../../adapters/repositories/orders/IOrdersRepository";
import { ShippingStatus } from "../../entities/orders/Order";

export interface ProcessZipnovaWebhookInput {
  topic: string | undefined;
  shipmentId: string | undefined;
  statusCode: string | undefined;
  statusName: string | undefined;
}

/**
 * Zipnova reports ~25 granular states; we only auto-advance our simplified
 * shippingStatus for the ones that matter operationally. Everything else is
 * still recorded verbatim in shippingZipnovaStatus for visibility.
 */
const STATUS_CODE_TO_SHIPPING_STATUS: Record<string, ShippingStatus> = {
  shipped: "shipped",
  delivered: "delivered",
  cancelled: "cancelled",
  lost: "cancelled",
};

export class ProcessZipnovaWebhookInteractor {
  constructor(private readonly ordersRepository: IOrdersRepository) {}

  async execute(input: ProcessZipnovaWebhookInput): Promise<void> {
    if (input.topic !== "status" || !input.shipmentId) {
      return;
    }

    const order = await this.ordersRepository.findByZipnovaShipmentId(
      input.shipmentId,
    );

    if (!order) {
      return;
    }

    await this.ordersRepository.updateZipnovaRawStatus(
      order.id,
      input.statusName ?? input.statusCode ?? "unknown",
    );

    const mappedStatus = input.statusCode
      ? STATUS_CODE_TO_SHIPPING_STATUS[input.statusCode]
      : undefined;

    if (mappedStatus) {
      await this.ordersRepository.setShippingStatus(order.id, mappedStatus);
    }
  }
}
