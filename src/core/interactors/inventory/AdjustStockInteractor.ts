import { IInventoryMovementsRepository } from "../../adapters/repositories/inventoryMovements/IInventoryMovementsRepository";
import { IProductStockRepository } from "../../adapters/repositories/productStock/IProductStockRepository";
import { IProductsRepository } from "../../adapters/repositories/products/IProductsRepository";
import { IWarehousesRepository } from "../../adapters/repositories/warehouses/IWarehousesRepository";
import { InventoryMovement } from "../../entities/inventoryMovements/InventoryMovement";
import { WarehouseNotFoundError } from "../warehouses/WarehouseNotFoundError";
import { ProductNotFoundError } from "../orders/ProductNotFoundError";

export interface AdjustStockInput {
  sku: string;
  warehouseId: string;
  /** The real, counted stock for this SKU at this warehouse — not a delta. */
  newStock: number;
  note?: string | null;
  occurredAt?: Date;
}

/**
 * Corrects a warehouse's stock to match a physical count. Unlike restock/gift
 * (which add or subtract a known quantity), this takes the actual counted
 * number and computes the delta itself — the admin doesn't have to do math.
 */
export class AdjustStockInteractor {
  constructor(
    private readonly productsRepository: IProductsRepository,
    private readonly productStockRepository: IProductStockRepository,
    private readonly warehousesRepository: IWarehousesRepository,
    private readonly inventoryMovementsRepository: IInventoryMovementsRepository,
  ) {}

  async execute(input: AdjustStockInput): Promise<InventoryMovement> {
    const product = await this.productsRepository.getBySku(input.sku);

    if (!product) {
      throw new ProductNotFoundError(input.sku);
    }

    const warehouse = await this.warehousesRepository.getById(
      input.warehouseId,
    );

    if (!warehouse || !warehouse.isActive) {
      throw new WarehouseNotFoundError(input.warehouseId);
    }

    const currentStock = await this.productStockRepository.getStock(
      product.id,
      warehouse.id,
    );
    const delta = input.newStock - currentStock;

    let stockAfter = currentStock;

    if (delta > 0) {
      stockAfter = await this.productStockRepository.incrementStock(
        product.id,
        warehouse.id,
        delta,
      );
    } else if (delta < 0) {
      const result = await this.productStockRepository.decrementStock(
        product.id,
        warehouse.id,
        -delta,
      );
      // currentStock was just read, so this can only be null in a genuine
      // race with a concurrent movement — extremely unlikely for a manual
      // admin action, but fall back to the counted value rather than throw.
      stockAfter = result ?? input.newStock;
    }

    return this.inventoryMovementsRepository.record({
      productId: product.id,
      movementType: "adjustment",
      quantityDelta: delta,
      stockAfter,
      warehouseId: warehouse.id,
      note: input.note ?? null,
      occurredAt: input.occurredAt,
    });
  }
}
