import { CreateOrderEventData } from "../../../entities/orderEvents/OrderEvent";

export const ORDER_EVENTS_REPOSITORY = Symbol("ORDER_EVENTS_REPOSITORY");

export interface IOrderEventsRepository {
  append(data: CreateOrderEventData): Promise<void>;
}
