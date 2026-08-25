export type MovementType =
  "sale" | "cancellation" | "return" | "gift" | "restock" | "adjustment";

export interface InventoryMovement {
  id: string;
  productId: string;
  movementType: MovementType;
  quantityDelta: number;
  stockAfter: number;
  orderId: string | null;
  warehouseId: string | null;
  note: string | null;
  occurredAt: Date;
  createdAt: Date;
}

export interface RecordInventoryMovementData {
  productId: string;
  movementType: MovementType;
  quantityDelta: number;
  stockAfter: number;
  orderId?: string | null;
  warehouseId?: string | null;
  note?: string | null;
  occurredAt?: Date;
}
