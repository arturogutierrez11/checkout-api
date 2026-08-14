-- Estado de envío independiente del estado de pago, editable a mano desde
-- el panel de admin (hasta que haya integración real con un correo).
alter table checkout_orders
  add column if not exists shipping_status text not null default 'pending_dispatch'
    check (shipping_status in ('pending_dispatch', 'dispatched', 'shipped', 'cancelled'));

-- Las órdenes que ya tenían shipped_at seteado (marcadas "enviada" con el
-- flujo viejo) quedan reflejadas en el nuevo estado.
update checkout_orders
set shipping_status = 'shipped'
where shipped_at is not null and shipping_status = 'pending_dispatch';
