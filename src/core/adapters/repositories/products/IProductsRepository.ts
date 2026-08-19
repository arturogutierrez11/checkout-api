import { Product } from "../../../entities/products/Product";

export const PRODUCTS_REPOSITORY = Symbol("PRODUCTS_REPOSITORY");

export interface IProductsRepository {
  listActive(): Promise<Product[]>;
  listAll(): Promise<Product[]>;
  getBySlug(slug: string): Promise<Product | null>;
  getBySku(sku: string): Promise<Product | null>;
  getById(id: string): Promise<Product | null>;
  /** Atomic: only succeeds if enough stock was available. Returns the resulting stock, or null if not. */
  decrementStock(productId: string, quantity: number): Promise<number | null>;
  /** Returns the resulting stock. */
  incrementStock(productId: string, quantity: number): Promise<number>;
  /** Returns the updated product, or null if it doesn't exist. */
  updatePrice(productId: string, price: number): Promise<Product | null>;
}
