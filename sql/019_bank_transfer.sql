-- Pago por transferencia bancaria: la orden nace 'pending' sin pasar por
-- Mercado Pago y se concilia a mano desde el panel. Guardamos el descuento
-- aparte para que subtotal siga siendo el precio de lista.
alter table checkout_orders
  add column if not exists discount_amount numeric(12,2) not null default 0;

alter table checkout_orders
  drop constraint if exists checkout_orders_sales_channel_check;

alter table checkout_orders
  add constraint checkout_orders_sales_channel_check
  check (sales_channel in ('mercadopago', 'manual', 'bank_transfer'));
