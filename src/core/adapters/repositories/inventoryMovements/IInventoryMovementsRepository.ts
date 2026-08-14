import {
  InventoryMovement,
  RecordInventoryMovementData,
} from "../../../entities/inventoryMovements/InventoryMovement";

export const INVENTORY_MOVEMENTS_REPOSITORY = Symbol(
  "INVENTORY_MOVEMENTS_REPOSITORY",
);

export interface IInventoryMovementsRepository {
  record(data: RecordInventoryMovementData): Promise<InventoryMovement>;
  listByProduct(
    productId: string,
    limit: number,
    offset: number,
  ): Promise<InventoryMovement[]>;
  listByOrder(orderId: string): Promise<InventoryMovement[]>;
  listAll(limit: number, offset: number): Promise<InventoryMovement[]>;
}
