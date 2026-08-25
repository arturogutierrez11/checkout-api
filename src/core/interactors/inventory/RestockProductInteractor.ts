import { IInventoryMovementsRepository } from "../../adapters/repositories/inventoryMovements/IInventoryMovementsRepository";
import { IProductStockRepository } from "../../adapters/repositories/productStock/IProductStockRepository";
import { IProductsRepository } from "../../adapters/repositories/products/IProductsRepository";
import { IWarehousesRepository } from "../../adapters/repositories/warehouses/IWarehousesRepository";
import { InventoryMovement } from "../../entities/inventoryMovements/InventoryMovement";
import { WarehouseNotFoundError } from "../warehouses/WarehouseNotFoundError";
import { ProductNotFoundError } from "../orders/ProductNotFoundError";

export interface RestockProductInput {
  sku: string;
  warehouseId: string;
  quantity: number;
  note?: string | null;
  occurredAt?: Date;
}

export class RestockProductInteractor {
  constructor(
    private readonly productsRepository: IProductsRepository,
    private readonly productStockRepository: IProductStockRepository,
    private readonly warehousesRepository: IWarehousesRepository,
    private readonly inventoryMovementsRepository: IInventoryMovementsRepository,
  ) {}

  async execute(input: RestockProductInput): Promise<InventoryMovement> {
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

    const stockAfter = await this.productStockRepository.incrementStock(
      product.id,
      warehouse.id,
      input.quantity,
    );

    return this.inventoryMovementsRepository.record({
      productId: product.id,
      movementType: "restock",
      quantityDelta: input.quantity,
      stockAfter,
      warehouseId: warehouse.id,
      note: input.note ?? null,
      occurredAt: input.occurredAt,
    });
  }
}
