import { ShippingMethod } from "./Order";

// Fuente de verdad del precio de envío (fijo por ahora, ver Correo Argentino a futuro).
export const SHIPPING_PRICES: Record<ShippingMethod, number> = {
  standard: 0,
  express: 4900,
};
