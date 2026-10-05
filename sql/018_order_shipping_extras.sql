-- Datos opcionales del domicilio de entrega que el comprador completa en el
-- checkout: piso, departamento y observaciones para quien entrega.
alter table checkout_orders
  add column if not exists shipping_floor text,
  add column if not exists shipping_apartment text,
  add column if not exists shipping_notes text;
