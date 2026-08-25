export const PRODUCT_STOCK_REPOSITORY = Symbol("PRODUCT_STOCK_REPOSITORY");

export interface ProductWarehouseStock {
  warehouseId: string;
  warehouseSlug: string;
  warehouseName: string;
  stock: number;
}

export interface IProductStockRepository {
  /** Atomic: only succeeds if that warehouse has enough stock. Returns the resulting stock, or null if not. */
  decrementStock(
    productId: string,
    warehouseId: string,
    quantity: number,
  ): Promise<number | null>;
  /** Upsert — works even if this (product, warehouse) pair never had a row. Returns the resulting stock. */
  incrementStock(
    productId: string,
    warehouseId: string,
    quantity: number,
  ): Promise<number>;
  /** Current stock of one product at one warehouse (0 if no row yet). */
  getStock(productId: string, warehouseId: string): Promise<number>;
  /** Per-warehouse breakdown for a product, only active warehouses. */
  listByProduct(productId: string): Promise<ProductWarehouseStock[]>;
  /** Sum of stock across every active warehouse. */
  getTotalStock(productId: string): Promise<number>;
}
