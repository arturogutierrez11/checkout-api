import { IInventoryMovementsRepository } from "../../adapters/repositories/inventoryMovements/IInventoryMovementsRepository";
import { IProductStockRepository } from "../../adapters/repositories/productStock/IProductStockRepository";
import { MovementType } from "../../entities/inventoryMovements/InventoryMovement";

export interface ReleaseOrderStockInput {
  orderId: string;
  /** Unused now (kept so every existing caller stays unchanged) — stock is released per the order's actual "sale" movements instead of being recomputed from the commercial product. */
  productId: string;
  quantity: number;
  movementType: MovementType;
  note?: string;
}

/**
 * Releases whatever physical stock was actually reserved for an order, by
 * reading its own "sale" movements (cards + packaging, tagged with the
 * warehouse they were taken from) and crediting each back to that same
 * warehouse. If the order never had a shipping label generated, it never
 * had stock decremented in the first place — nothing to release, no-op.
 * Used whenever an order stops being fulfillable: manual cancellation, a
 * rejected/cancelled Mercado Pago payment, or a return.
 */
export class ReleaseOrderStockInteractor {
  constructor(
    private readonly inventoryMovementsRepository: IInventoryMovementsRepository,
    private readonly productStockRepository: IProductStockRepository,
  ) {}

  async execute(input: ReleaseOrderStockInput): Promise<void> {
    const movements = await this.inventoryMovementsRepository.listByOrder(
      input.orderId,
    );
    const saleMovements = movements.filter(
      (movement) => movement.movementType === "sale" && movement.warehouseId,
    );

    await Promise.all(
      saleMovements.map(async (movement) => {
        const quantity = Math.abs(movement.quantityDelta);
        const stockAfter = await this.productStockRepository.incrementStock(
          movement.productId,
          movement.warehouseId as string,
          quantity,
        );

        await this.inventoryMovementsRepository.record({
          productId: movement.productId,
          movementType: input.movementType,
          quantityDelta: quantity,
          stockAfter,
          orderId: input.orderId,
          warehouseId: movement.warehouseId,
          note: input.note ?? null,
        });
      }),
    );
  }
}
