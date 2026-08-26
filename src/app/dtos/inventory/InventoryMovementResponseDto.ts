import { ApiProperty } from "@nestjs/swagger";
import { InventoryMovement } from "../../../core/entities/inventoryMovements/InventoryMovement";
import { requiredDateISOString } from "../common/dateResponse";

export class InventoryMovementResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() productId!: string;
  @ApiProperty() movementType!: string;
  @ApiProperty() quantityDelta!: number;
  @ApiProperty() stockAfter!: number;
  @ApiProperty({ nullable: true }) orderId!: string | null;
  @ApiProperty({ nullable: true }) warehouseId!: string | null;
  @ApiProperty({ nullable: true }) note!: string | null;
  @ApiProperty() occurredAt!: string;
  @ApiProperty() createdAt!: string;

  static fromEntity(movement: InventoryMovement): InventoryMovementResponseDto {
    return {
      id: movement.id,
      productId: movement.productId,
      movementType: movement.movementType,
      quantityDelta: movement.quantityDelta,
      stockAfter: movement.stockAfter,
      orderId: movement.orderId,
      warehouseId: movement.warehouseId,
      note: movement.note,
      occurredAt: requiredDateISOString(movement.occurredAt, "occurredAt"),
      createdAt: requiredDateISOString(movement.createdAt, "createdAt"),
    };
  }
}
