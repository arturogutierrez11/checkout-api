import { IOrderEventsRepository } from "../../adapters/repositories/orderEvents/IOrderEventsRepository";
import { IOrdersRepository } from "../../adapters/repositories/orders/IOrdersRepository";
import { Order } from "../../entities/orders/Order";
import { OrderNotFoundError } from "./OrderNotFoundError";
import { OrderNotShippableError } from "./OrderNotShippableError";
import { ReserveOrderStockInteractor } from "./ReserveOrderStockInteractor";

/**
 * Lets the admin pick a depósito for an order and decrement its stock right
 * away, independent of generating a Zipnova label or marking it shipped
 * manually — e.g. to reserve/pack the physical card ahead of deciding how
 * it'll actually go out. Whichever fulfillment action happens later reuses
 * this same reservation instead of decrementing again.
 */
export class AssignOrderWarehouseInteractor {
  constructor(
    private readonly ordersRepository: IOrdersRepository,
    private readonly reserveOrderStockInteractor: ReserveOrderStockInteractor,
    private readonly orderEventsRepository: IOrderEventsRepository,
  ) {}

  async execute(orderId: string, warehouseId: string): Promise<Order> {
    const order = await this.ordersRepository.getById(orderId);

    if (!order) {
      throw new OrderNotFoundError(orderId);
    }

    if (order.status !== "approved") {
      throw new OrderNotShippableError(orderId);
    }

    const { warehouse } = await this.reserveOrderStockInteractor.execute(
      order,
      warehouseId,
    );

    await this.orderEventsRepository.append({
      orderId,
      eventType: "warehouse_assigned",
      payload: { warehouseId: warehouse.id, warehouseSlug: warehouse.slug },
    });

    return order;
  }
}
