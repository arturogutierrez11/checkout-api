-- Fulfillment con Fullarg (3PL): empaquetan y despachan. Convive con Zipnova,
-- cada orden usa uno u otro. Guardamos el id de la orden en Fullarg
-- (SAL-ORD-...), el último evento/estado que nos avisaron por webhook y
-- cuándo se la mandamos.
alter table checkout_orders
  add column if not exists fullarg_sales_order text,
  add column if not exists fullarg_status text,
  add column if not exists fullarg_sent_at timestamptz;

create unique index if not exists checkout_orders_fullarg_sales_order_key
  on checkout_orders (fullarg_sales_order)
  where fullarg_sales_order is not null;
