import { IInventoryMovementsRepository } from "../../adapters/repositories/inventoryMovements/IInventoryMovementsRepository";
import { IProductsRepository } from "../../adapters/repositories/products/IProductsRepository";
import { MovementType } from "../../entities/inventoryMovements/InventoryMovement";
import { CARDS_SKU, PACKAGING_SKU } from "../../entities/products/Product";

export interface ReleaseOrderStockInput {
  orderId: string;
  /** The commercial product (bundle) the order was placed for — used to look up how many physical cards it represents. */
  productId: string;
  quantity: number;
  movementType: MovementType;
  note?: string;
}

/**
 * Releases the physical stock reserved for an order: the underlying cards
 * plus the matching packaging units (every card ships with one, so both
 * pools move by order.quantity * the ordered product's bundle size) — and
 * logs both movements for traceability. Used whenever an order stops being
 * fulfillable: manual cancellation, a rejected/cancelled Mercado Pago
 * payment, a failed payment preference creation, or a return.
 */
export class ReleaseOrderStockInteractor {
  constructor(
    private readonly productsRepository: IProductsRepository,
    private readonly inventoryMovementsRepository: IInventoryMovementsRepository,
  ) {}

  async execute(input: ReleaseOrderStockInput): Promise<void> {
    const product = await this.productsRepository.getById(input.productId);

    if (!product) {
      return;
    }

    const cardUnits = input.quantity * product.bundleUnits;

    const cardsProduct = await this.productsRepository.getBySku(CARDS_SKU);

    if (cardsProduct) {
      const cardsStock = await this.productsRepository.incrementStock(
        cardsProduct.id,
        cardUnits,
      );
      await this.inventoryMovementsRepository.record({
        productId: cardsProduct.id,
        movementType: input.movementType,
        quantityDelta: cardUnits,
        stockAfter: cardsStock,
        orderId: input.orderId,
        note: input.note ?? null,
      });
    }

    const packaging = await this.productsRepository.getBySku(PACKAGING_SKU);

    if (packaging) {
      const packagingStock = await this.productsRepository.incrementStock(
        packaging.id,
        cardUnits,
      );
      await this.inventoryMovementsRepository.record({
        productId: packaging.id,
        movementType: input.movementType,
        quantityDelta: cardUnits,
        stockAfter: packagingStock,
        orderId: input.orderId,
        note: input.note ?? null,
      });
    }
  }
}
