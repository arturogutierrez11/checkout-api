-- Las 3 SKUs vendibles (NFC0001/2/3) son combos de LA MISMA tarjeta física
-- (1, 2 y 10 unidades respectivamente). El inventario real vive en un único
-- pool de tarjetas + un único pool de packaging (1 packaging por tarjeta,
-- no por orden). bundle_units dice cuántas tarjetas físicas representa una
-- unidad de compra de ese SKU.

alter table checkout_products
  add column if not exists bundle_units integer not null default 1;

update checkout_products set bundle_units = 1 where sku = 'NFC0001';
update checkout_products set bundle_units = 2 where sku = 'NFC0002';
update checkout_products set bundle_units = 10 where sku = 'NFC0003';

-- Pool físico de tarjetas (no se vende directo, todos los combos descuentan de acá).
insert into checkout_products (slug, sku, name, price, currency, stock, is_active, is_internal, bundle_units)
values ('tarjetas', 'TARJETA0001', 'Tarjetas Rituo (stock físico)', 0, 'ARS', 1500, true, true, 1)
on conflict (slug) do nothing;

-- Ajustar el stock real de packaging (arrancó en 0 en la migración anterior).
update checkout_products set stock = 1500 where sku = 'PACKA0001';
