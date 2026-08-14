import { IInventoryMovementsRepository } from "../../adapters/repositories/inventoryMovements/IInventoryMovementsRepository";
import { IProductsRepository } from "../../adapters/repositories/products/IProductsRepository";
import { MovementType } from "../../entities/inventoryMovements/InventoryMovement";
import { PACKAGING_SKU } from "../../entities/products/Product";

export interface ReleaseOrderStockInput {
  orderId: string;
  productId: string;
  quantity: number;
  movementType: MovementType;
  note?: string;
}

/**
 * Releases the stock reserved for an order (the product itself plus the one
 * shared packaging unit every order consumes) and logs both movements for
 * traceability. Used whenever an order stops being fulfillable: manual
 * cancellation, a rejected/cancelled Mercado Pago payment, a failed payment
 * preference creation, or a return.
 */
export class ReleaseOrderStockInteractor {
  constructor(
    private readonly productsRepository: IProductsRepository,
    private readonly inventoryMovementsRepository: IInventoryMovementsRepository,
  ) {}

  async execute(input: ReleaseOrderStockInput): Promise<void> {
    const productStock = await this.productsRepository.incrementStock(
      input.productId,
      input.quantity,
    );
    await this.inventoryMovementsRepository.record({
      productId: input.productId,
      movementType: input.movementType,
      quantityDelta: input.quantity,
      stockAfter: productStock,
      orderId: input.orderId,
      note: input.note ?? null,
    });

    const packaging = await this.productsRepository.getBySku(PACKAGING_SKU);
    if (!packaging) {
      return;
    }

    const packagingStock = await this.productsRepository.incrementStock(
      packaging.id,
      1,
    );
    await this.inventoryMovementsRepository.record({
      productId: packaging.id,
      movementType: input.movementType,
      quantityDelta: 1,
      stockAfter: packagingStock,
      orderId: input.orderId,
      note: input.note ?? null,
    });
  }
}
