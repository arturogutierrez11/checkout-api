/** Single internal SKU consumed once per order regardless of card quantity (every shipment uses one). */
export const PACKAGING_SKU = "PACKA0001";

export interface Product {
  id: string;
  slug: string;
  sku: string;
  name: string;
  price: number;
  currency: string;
  stock: number;
  isActive: boolean;
  /** True for internal-only SKUs (e.g. packaging) that aren't sold directly to customers. */
  isInternal: boolean;
  createdAt: Date;
  updatedAt: Date;
}
