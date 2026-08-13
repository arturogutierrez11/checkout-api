-- Idempotencia para POST /orders. Checkout anónimo (sin userId), la clave
-- generada por el cliente es la única identidad de la operación.
create table if not exists checkout_idempotency_operations (
  idempotency_key text primary key,
  operation text not null,
  request_hash text not null,
  resource_id text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists idx_checkout_idempotency_operations_expires_at
  on checkout_idempotency_operations (expires_at);
