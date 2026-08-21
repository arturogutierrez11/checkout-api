-- Último estado crudo que reportó Zipnova (para trazabilidad/debug), y
-- sumamos 'delivered' al estado simplificado ya que ahora el webhook nos
-- avisa de verdad cuando el paquete llegó.
alter table checkout_orders
  add column if not exists shipping_zipnova_status text;

alter table checkout_orders
  drop constraint if exists checkout_orders_shipping_status_check;

alter table checkout_orders
  add constraint checkout_orders_shipping_status_check
  check (shipping_status in ('pending_dispatch', 'dispatched', 'shipped', 'delivered', 'cancelled'));
