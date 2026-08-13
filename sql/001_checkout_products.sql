-- Catálogo de productos vendibles (1 SKU físico por producto).
create table if not exists checkout_products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  sku text not null unique,
  name text not null,
  price numeric(12, 2) not null check (price >= 0),
  currency text not null default 'ARS',
  stock integer not null default 0 check (stock >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
