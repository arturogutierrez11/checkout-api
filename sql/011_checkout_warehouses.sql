-- Multi-depósito: cada depósito tiene su propio stock y su propio origen de
-- envío en Zipnova. El stock deja de descontarse al crear la orden y pasa a
-- descontarse recién cuando el admin elige el depósito y genera la etiqueta.

create table if not exists checkout_warehouses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  address_street text,
  address_city text,
  address_state text,
  address_zipcode text,
  address_phone text,
  address_email text,
  zipnova_origin_id integer not null,
  priority integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists checkout_product_stock (
  product_id uuid not null references checkout_products(id),
  warehouse_id uuid not null references checkout_warehouses(id),
  stock integer not null default 0 check (stock >= 0),
  updated_at timestamptz not null default now(),
  primary key (product_id, warehouse_id)
);

alter table checkout_inventory_movements
  add column if not exists warehouse_id uuid references checkout_warehouses(id);

create index if not exists idx_checkout_inventory_movements_warehouse_id
  on checkout_inventory_movements (warehouse_id);

-- Depósito existente (mismo origin_id que ya usa ZIPNOVA_ORIGIN_ID hoy).
insert into checkout_warehouses (slug, name, zipnova_origin_id, priority)
values ('principal', 'Depósito Principal', 380216, 0)
on conflict (slug) do nothing;

-- Depósito Centro (Cramer 640 depto 5H, Colegiales, CABA) — origen ya
-- registrado en Zipnova (id 380321) vía POST /v2/addresses.
insert into checkout_warehouses (
  slug, name, address_street, address_city, address_state, address_zipcode,
  address_phone, address_email, zipnova_origin_id, priority
)
values (
  'centro', 'Depósito Centro', 'Cramer 640, Depto 5H',
  'Ciudad Autónoma de Buenos Aires', 'Ciudad Autónoma de Buenos Aires',
  '1426', '+5491136090308', 'hello@rituo.io', 380321, 1
)
on conflict (slug) do nothing;

-- Migra el stock actual de las tarjetas y el packaging al depósito principal;
-- el depósito Centro arranca en 0 (se ingresa a mano desde el panel).
insert into checkout_product_stock (product_id, warehouse_id, stock)
select p.id, w.id, case when w.slug = 'principal' then p.stock else 0 end
from checkout_products p
cross join checkout_warehouses w
where p.sku in ('TARJETA0001', 'PACKA0001')
on conflict (product_id, warehouse_id) do nothing;

-- Todo movimiento histórico pasó, de hecho, por el único depósito que existía.
update checkout_inventory_movements
set warehouse_id = (select id from checkout_warehouses where slug = 'principal')
where warehouse_id is null;
