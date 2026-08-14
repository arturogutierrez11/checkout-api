-- Inventario: SKUs internos (no vendibles al público, ej. packaging) y un
-- libro de movimientos de stock para trazabilidad completa.

alter table checkout_products
  add column if not exists is_internal boolean not null default false;

create table if not exists checkout_inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references checkout_products(id),
  movement_type text not null
    check (movement_type in ('sale', 'cancellation', 'return', 'gift', 'restock')),
  quantity_delta integer not null check (quantity_delta <> 0),
  stock_after integer not null check (stock_after >= 0),
  order_id uuid references checkout_orders(id),
  note text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_checkout_inventory_movements_product_id
  on checkout_inventory_movements (product_id, occurred_at desc);
create index if not exists idx_checkout_inventory_movements_order_id
  on checkout_inventory_movements (order_id);

-- Packaging: un solo SKU, se descuenta 1 unidad por cada orden (no por
-- cantidad de tarjetas), porque cada envío usa un packaging.
insert into checkout_products (slug, sku, name, price, currency, stock, is_active, is_internal)
values ('packaging', 'PACKA0001', 'Packaging Rituo', 0, 'ARS', 0, true, true)
on conflict (slug) do nothing;
