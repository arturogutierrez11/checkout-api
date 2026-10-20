/** Descuento sobre el subtotal del producto al pagar por transferencia bancaria. */
export const BANK_TRANSFER_DISCOUNT_RATE = 0.1;

/** Descuento por combo: cuántas unidades se llevan en la misma compra. */
export const COMBO_DISCOUNT_TIERS: { minQuantity: number; rate: number }[] = [
  { minQuantity: 3, rate: 0.1 },
  { minQuantity: 2, rate: 0.05 },
];

export function comboDiscountRate(quantity: number): number {
  return (
    COMBO_DISCOUNT_TIERS.find((tier) => quantity >= tier.minQuantity)?.rate ?? 0
  );
}

export function bankTransferDiscount(subtotal: number): number {
  return Math.round(subtotal * BANK_TRANSFER_DISCOUNT_RATE);
}

export function comboDiscount(subtotal: number, quantity: number): number {
  return Math.round(subtotal * comboDiscountRate(quantity));
}

/** Los dos descuentos se calculan sobre el subtotal de lista y se suman. */
export function orderDiscount(
  subtotal: number,
  quantity: number,
  paymentMethod: "mercadopago" | "bank_transfer",
): number {
  return (
    comboDiscount(subtotal, quantity) +
    (paymentMethod === "bank_transfer" ? bankTransferDiscount(subtotal) : 0)
  );
}
