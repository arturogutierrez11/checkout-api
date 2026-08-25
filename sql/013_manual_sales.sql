-- Ventas registradas a mano por el admin (efectivo, transferencia, etc.),
-- por fuera del flujo de Mercado Pago.
alter table checkout_orders
  add column if not exists sales_channel text not null default 'mercadopago',
  add column if not exists manual_payment_method text,
  add column if not exists manual_payment_note text;

alter table checkout_orders
  drop constraint if exists checkout_orders_sales_channel_check;

alter table checkout_orders
  add constraint checkout_orders_sales_channel_check
  check (sales_channel in ('mercadopago', 'manual'));
