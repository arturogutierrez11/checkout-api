import { Order } from "../../../entities/orders/Order";

export const META_CONVERSIONS_GATEWAY = Symbol("META_CONVERSIONS_GATEWAY");

export interface IMetaConversionsGateway {
  sendPurchaseEvent(order: Order): Promise<void>;
}
