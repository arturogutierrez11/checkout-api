import { IInventoryMovementsRepository } from "../../adapters/repositories/inventoryMovements/IInventoryMovementsRepository";
import { IProductsRepository } from "../../adapters/repositories/products/IProductsRepository";
import { InventoryMovement } from "../../entities/inventoryMovements/InventoryMovement";
import { CARDS_SKU, PACKAGING_SKU } from "../../entities/products/Product";
import { InsufficientStockError } from "../orders/InsufficientStockError";
import { ProductNotFoundError } from "../orders/ProductNotFoundError";

export interface RecordGiftInput {
  sku: string;
  quantity: number;
  occurredAt: Date;
  note?: string | null;
}

/**
 * Gifts/donations subtract straight from physical stock, never touching
 * checkout_orders — there is no payment or shipping flow, just the ledger.
 * Gifting cards also consumes the matching packaging units 1:1 (every card
 * ships with one); gifting packaging on its own does not.
 */
export class RecordGiftInteractor {
  constructor(
    private readonly productsRepository: IProductsRepository,
    private readonly inventoryMovementsRepository: IInventoryMovementsRepository,
  ) {}

  async execute(input: RecordGiftInput): Promise<InventoryMovement> {
    const product = await this.productsRepository.getBySku(input.sku);

    if (!product) {
      throw new ProductNotFoundError(input.sku);
    }

    const productStock = await this.productsRepository.decrementStock(
      product.id,
      input.quantity,
    );

    if (productStock === null) {
      throw new InsufficientStockError(product.id);
    }

    let packagingId: string | null = null;
    let packagingStock: number | null = null;

    if (product.sku === CARDS_SKU) {
      const packaging = await this.productsRepository.getBySku(PACKAGING_SKU);

      if (packaging) {
        packagingStock = await this.productsRepository.decrementStock(
          packaging.id,
          input.quantity,
        );

        if (packagingStock === null) {
          await this.productsRepository.incrementStock(
            product.id,
            input.quantity,
          );
          throw new InsufficientStockError(packaging.id);
        }

        packagingId = packaging.id;
      }
    }

    const movement = await this.inventoryMovementsRepository.record({
      productId: product.id,
      movementType: "gift",
      quantityDelta: -input.quantity,
      stockAfter: productStock,
      note: input.note ?? null,
      occurredAt: input.occurredAt,
    });

    if (packagingId && packagingStock !== null) {
      await this.inventoryMovementsRepository.record({
        productId: packagingId,
        movementType: "gift",
        quantityDelta: -input.quantity,
        stockAfter: packagingStock,
        note: input.note ?? null,
        occurredAt: input.occurredAt,
      });
    }

    return movement;
  }
}
