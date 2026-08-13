-- Auditoría append-only: cada webhook recibido/procesado de Mercado Pago.
create table if not exists checkout_order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references checkout_orders(id),
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_checkout_order_events_order_id
  on checkout_order_events (order_id, created_at);
