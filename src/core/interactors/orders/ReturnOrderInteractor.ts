import { IInventoryMovementsRepository } from "../../adapters/repositories/inventoryMovements/IInventoryMovementsRepository";
import { IOrdersRepository } from "../../adapters/repositories/orders/IOrdersRepository";
import { Order } from "../../entities/orders/Order";
import { ReleaseOrderStockInteractor } from "../inventory/ReleaseOrderStockInteractor";
import { OrderNotFoundError } from "./OrderNotFoundError";
import { OrderNotReturnableError } from "./OrderNotReturnableError";

export class ReturnOrderInteractor {
  constructor(
    private readonly ordersRepository: IOrdersRepository,
    private readonly inventoryMovementsRepository: IInventoryMovementsRepository,
    private readonly releaseOrderStockInteractor: ReleaseOrderStockInteractor,
  ) {}

  async execute(orderId: string, note?: string): Promise<Order> {
    const order = await this.ordersRepository.getById(orderId);

    if (!order) {
      throw new OrderNotFoundError(orderId);
    }

    if (order.status !== "approved") {
      throw new OrderNotReturnableError(orderId);
    }

    const existingMovements =
      await this.inventoryMovementsRepository.listByOrder(orderId);

    if (
      existingMovements.some((movement) => movement.movementType === "return")
    ) {
      throw new OrderNotReturnableError(orderId);
    }

    await this.releaseOrderStockInteractor.execute({
      orderId,
      productId: order.productId,
      quantity: order.quantity,
      movementType: "return",
      note: note ?? "returned",
    });

    return order;
  }
}
