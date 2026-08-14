import { IInventoryMovementsRepository } from "../../adapters/repositories/inventoryMovements/IInventoryMovementsRepository";
import { IProductsRepository } from "../../adapters/repositories/products/IProductsRepository";
import { InventoryMovement } from "../../entities/inventoryMovements/InventoryMovement";
import { ProductNotFoundError } from "../orders/ProductNotFoundError";

export interface RestockProductInput {
  sku: string;
  quantity: number;
  note?: string | null;
  occurredAt?: Date;
}

export class RestockProductInteractor {
  constructor(
    private readonly productsRepository: IProductsRepository,
    private readonly inventoryMovementsRepository: IInventoryMovementsRepository,
  ) {}

  async execute(input: RestockProductInput): Promise<InventoryMovement> {
    const product = await this.productsRepository.getBySku(input.sku);

    if (!product) {
      throw new ProductNotFoundError(input.sku);
    }

    const stockAfter = await this.productsRepository.incrementStock(
      product.id,
      input.quantity,
    );

    return this.inventoryMovementsRepository.record({
      productId: product.id,
      movementType: "restock",
      quantityDelta: input.quantity,
      stockAfter,
      note: input.note ?? null,
      occurredAt: input.occurredAt,
    });
  }
}
