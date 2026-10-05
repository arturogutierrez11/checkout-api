/** Descuento sobre el subtotal del producto al pagar por transferencia bancaria. */
export const BANK_TRANSFER_DISCOUNT_RATE = 0.1;

export function bankTransferDiscount(subtotal: number): number {
  return Math.round(subtotal * BANK_TRANSFER_DISCOUNT_RATE);
}
