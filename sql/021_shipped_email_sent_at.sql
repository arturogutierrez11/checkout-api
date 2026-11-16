-- Marca de cuándo se le mandó al comprador el mail "Tu pedido está en camino"
-- con el número de seguimiento. Sirve para no mandarlo dos veces cuando
-- Fullarg repite el webhook o avisa varios eventos de la misma orden.
alter table checkout_orders
  add column if not exists shipped_email_sent_at timestamptz;
