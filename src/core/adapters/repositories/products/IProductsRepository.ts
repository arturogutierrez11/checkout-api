import { Product } from "../../../entities/products/Product";

export const PRODUCTS_REPOSITORY = Symbol("PRODUCTS_REPOSITORY");

export interface IProductsRepository {
  listActive(): Promise<Product[]>;
  getBySlug(slug: string): Promise<Product | null>;
  getById(id: string): Promise<Product | null>;
  /** Atomic: only succeeds (returns true) if enough stock was available. */
  decrementStock(productId: string, quantity: number): Promise<boolean>;
  /** Compensation for a failed order creation / MP preference creation. */
  incrementStock(productId: string, quantity: number): Promise<void>;
}
