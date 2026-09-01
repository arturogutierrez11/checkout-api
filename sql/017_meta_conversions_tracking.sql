-- Datos de atribución de Meta Ads capturados al crear la orden (navegador +
-- headers de la request de checkout), usados para mandar el evento Purchase
-- por Conversions API cuando el pago queda aprobado. Todas nullable: no
-- existen para ventas manuales ni para pedidos creados antes de este cambio.
alter table checkout_orders
  add column if not exists fbp text,
  add column if not exists fbc text,
  add column if not exists client_ip_address text,
  add column if not exists client_user_agent text,
  add column if not exists meta_purchase_sent_at timestamptz;
