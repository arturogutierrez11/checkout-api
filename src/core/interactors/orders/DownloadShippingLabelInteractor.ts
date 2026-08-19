import { IOrdersRepository } from "../../adapters/repositories/orders/IOrdersRepository";
import { IZipnovaGateway } from "../../adapters/services/zipnova/IZipnovaGateway";
import { ZipnovaLabel } from "../../entities/zipnova/ZipnovaShipment";
import { OrderNotFoundError } from "./OrderNotFoundError";
import { ShippingLabelNotReadyError } from "./ShippingLabelNotReadyError";

export class DownloadShippingLabelInteractor {
  constructor(
    private readonly ordersRepository: IOrdersRepository,
    private readonly zipnovaGateway: IZipnovaGateway,
  ) {}

  async execute(orderId: string): Promise<ZipnovaLabel> {
    const order = await this.ordersRepository.getById(orderId);

    if (!order) {
      throw new OrderNotFoundError(orderId);
    }

    if (!order.shippingZipnovaShipmentId) {
      throw new ShippingLabelNotReadyError(orderId);
    }

    return this.zipnovaGateway.downloadLabel(
      Number(order.shippingZipnovaShipmentId),
    );
  }
}
