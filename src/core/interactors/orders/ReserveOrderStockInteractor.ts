import { IInventoryMovementsRepository } from "../../adapters/repositories/inventoryMovements/IInventoryMovementsRepository";
import { IProductStockRepository } from "../../adapters/repositories/productStock/IProductStockRepository";
import { IProductsRepository } from "../../adapters/repositories/products/IProductsRepository";
import { IWarehousesRepository } from "../../adapters/repositories/warehouses/IWarehousesRepository";
import { InventoryMovement } from "../../entities/inventoryMovements/InventoryMovement";
import { Order } from "../../entities/orders/Order";
import { CARDS_SKU, PACKAGING_SKU } from "../../entities/products/Product";
import { Warehouse } from "../../entities/warehouses/Warehouse";
import { WarehouseNotFoundError } from "../warehouses/WarehouseNotFoundError";
import { InsufficientStockError } from "./InsufficientStockError";
import { ProductNotFoundError } from "./ProductNotFoundError";

export interface ReserveOrderStockResult {
  warehouse: Warehouse;
  cardUnits: number;
}

/** Sale/cancellation/return movements, most recent first. */
function existingReservationMovements(
  movements: InventoryMovement[],
): InventoryMovement[] {
  return movements
    .filter((movement) =>
      (["sale", "cancellation", "return"] as const).includes(
        movement.movementType as "sale" | "cancellation" | "return",
      ),
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Shared by every path that fulfills an order — Zipnova label generation and
 * the manual "mark as shipped" flow (moto, entrega en persona, etc.) — so
 * stock only ever gets decremented once, from one depósito, no matter which
 * fulfillment path an order takes.
 *
 * Orders created before multi-warehouse stock already had their cards +
 * packaging decremented at checkout time (against the single warehouse that
 * existed then, backfilled to "principal"). For those, this does NOT
 * decrement again — it just reports which warehouse the stock actually came
 * from, ignoring whatever the admin selected. Only orders with no "sale"
 * movements yet get stock decremented here, from the selected warehouse.
 */
export class ReserveOrderStockInteractor {
  constructor(
    private readonly productsRepository: IProductsRepository,
    private readonly productStockRepository: IProductStockRepository,
    private readonly warehousesRepository: IWarehousesRepository,
    private readonly inventoryMovementsRepository: IInventoryMovementsRepository,
  ) {}

  async execute(
    order: Order,
    selectedWarehouseId: string,
  ): Promise<ReserveOrderStockResult> {
    const selectedWarehouse =
      await this.warehousesRepository.getById(selectedWarehouseId);

    if (!selectedWarehouse || !selectedWarehouse.isActive) {
      throw new WarehouseNotFoundError(selectedWarehouseId);
    }

    const product = await this.productsRepository.getById(order.productId);

    if (!product) {
      throw new ProductNotFoundError(order.productSku);
    }

    const cardUnits = order.quantity * product.bundleUnits;

    // A "sale" can later be undone by a "cancellation"/"return" (e.g. a
    // voided Zipnova shipment reset via ResetShippingLabelInteractor) —
    // whether this order is *currently* reserved depends on which of those
    // happened most recently, not on whether a "sale" ever existed at all.
    const reservationMovements = existingReservationMovements(
      await this.inventoryMovementsRepository.listByOrder(order.id),
    );
    const latest = reservationMovements[0];

    if (latest?.movementType === "sale" && latest.warehouseId) {
      const alreadyReservedWarehouse = await this.warehousesRepository.getById(
        latest.warehouseId,
      );

      if (alreadyReservedWarehouse) {
        return { warehouse: alreadyReservedWarehouse, cardUnits };
      }
    }

    await this.reserveStockAtWarehouse(order.id, cardUnits, selectedWarehouse);
    return { warehouse: selectedWarehouse, cardUnits };
  }

  private async reserveStockAtWarehouse(
    orderId: string,
    cardUnits: number,
    warehouse: Warehouse,
  ): Promise<void> {
    const cardsProduct = await this.productsRepository.getBySku(CARDS_SKU);

    if (!cardsProduct) {
      throw new Error(`Cards product ${CARDS_SKU} not found`);
    }

    const packaging = await this.productsRepository.getBySku(PACKAGING_SKU);

    if (!packaging) {
      throw new Error(`Packaging product ${PACKAGING_SKU} not found`);
    }

    const cardsStock = await this.productStockRepository.decrementStock(
      cardsProduct.id,
      warehouse.id,
      cardUnits,
    );

    if (cardsStock === null) {
      throw new InsufficientStockError(cardsProduct.id);
    }

    const packagingStock = await this.productStockRepository.decrementStock(
      packaging.id,
      warehouse.id,
      cardUnits,
    );

    if (packagingStock === null) {
      await this.productStockRepository.incrementStock(
        cardsProduct.id,
        warehouse.id,
        cardUnits,
      );
      throw new InsufficientStockError(packaging.id);
    }

    await Promise.all([
      this.inventoryMovementsRepository.record({
        productId: cardsProduct.id,
        movementType: "sale",
        quantityDelta: -cardUnits,
        stockAfter: cardsStock,
        orderId,
        warehouseId: warehouse.id,
      }),
      this.inventoryMovementsRepository.record({
        productId: packaging.id,
        movementType: "sale",
        quantityDelta: -cardUnits,
        stockAfter: packagingStock,
        orderId,
        warehouseId: warehouse.id,
      }),
    ]);
  }
}
