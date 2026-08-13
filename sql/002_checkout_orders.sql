-- Órdenes de compra. Guarda un snapshot del producto al momento de la
-- compra (no depende de que checkout_products no cambie después).
create table if not exists checkout_orders (
  id uuid primary key default gen_random_uuid(),

  product_id uuid not null references checkout_products(id),
  product_sku text not null,
  product_name text not null,
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  currency text not null default 'ARS',
  subtotal numeric(12, 2) not null check (subtotal >= 0),

  shipping_method text not null check (shipping_method in ('standard', 'express')),
  shipping_price numeric(12, 2) not null default 0 check (shipping_price >= 0),
  total numeric(12, 2) not null check (total >= 0),

  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'cancelled', 'payment_init_failed')),

  customer_first_name text not null,
  customer_last_name text not null,
  customer_email text not null,
  customer_phone text not null,

  shipping_address text not null,
  shipping_city text not null,
  shipping_province text not null,
  shipping_postal_code text not null,

  billing_dni text not null,
  billing_use_shipping_address boolean not null default true,
  billing_address text,
  billing_city text,
  billing_province text,
  billing_postal_code text,
  is_business_purchase boolean not null default false,
  billing_cuit text,
  billing_business_name text,

  mp_preference_id text,
  mp_init_point text,
  mp_payment_id text,
  mp_payment_status text,
  mp_payment_status_detail text,

  -- Fase 2 (Correo Argentino) — sin usar todavía.
  shipping_carrier text,
  shipping_tracking_number text,
  shipping_label_url text,
  shipped_at timestamptz,

  -- Fase futura (AFIP/ARCA) — sin usar todavía.
  invoice_status text,
  invoice_cae text,
  invoice_type text,
  invoice_number text,
  invoiced_at timestamptz,

  approved_at timestamptz,
  email_sent_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint checkout_orders_billing_address_check check (
    billing_use_shipping_address = true
    or (
      billing_address is not null
      and billing_city is not null
      and billing_province is not null
      and billing_postal_code is not null
    )
  ),
  constraint checkout_orders_business_billing_check check (
    is_business_purchase = false
    or (billing_cuit is not null and billing_business_name is not null)
  )
);

create index if not exists idx_checkout_orders_status on checkout_orders (status);
create index if not exists idx_checkout_orders_mp_preference_id on checkout_orders (mp_preference_id);
create index if not exists idx_checkout_orders_mp_payment_id on checkout_orders (mp_payment_id);
create index if not exists idx_checkout_orders_customer_email on checkout_orders (customer_email);
create index if not exists idx_checkout_orders_created_at on checkout_orders (created_at desc);
