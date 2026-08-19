/** Internal SKU for the physical packaging pool: every card ships with one, so it moves 1:1 with card units. */
export const PACKAGING_SKU = "PACKA0001";

/** Internal SKU for the physical card pool. NFC0001/0002/0003 are commercial bundles of this same card. */
export const CARDS_SKU = "TARJETA0001";

/** Physical dimensions of one packaged card as it ships — every order is N of this same unit. */
export const CARD_WEIGHT_GRAMS = 100;
export const CARD_LENGTH_CM = 10;
export const CARD_WIDTH_CM = 10;
export const CARD_HEIGHT_CM = 3;

export interface Product {
  id: string;
  slug: string;
  sku: string;
  name: string;
  price: number;
  currency: string;
  stock: number;
  isActive: boolean;
  /** True for internal-only SKUs (cards, packaging) that aren't sold directly to customers. */
  isInternal: boolean;
  /** How many physical cards one purchased unit of this SKU represents (e.g. the "pack of 10" bundle = 10). */
  bundleUnits: number;
  createdAt: Date;
  updatedAt: Date;
}
