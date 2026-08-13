import { IOrdersRepository } from "../../adapters/repositories/orders/IOrdersRepository";
import { Order, OrderStatus } from "../../entities/orders/Order";

export interface ListOrdersFilter {
  status?: OrderStatus;
  limit: number;
  offset: number;
}

export class ListOrdersInteractor {
  constructor(private readonly ordersRepository: IOrdersRepository) {}

  execute(filter: ListOrdersFilter): Promise<Order[]> {
    return this.ordersRepository.list(filter);
  }
}
