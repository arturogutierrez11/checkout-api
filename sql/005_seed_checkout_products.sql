-- Precios y stock de arranque copiados de la landing actual: son
-- PLACEHOLDERS, confirmar los reales antes de ir a producción.
insert into checkout_products (slug, sku, name, price, currency, stock, is_active)
values
  ('tag-one', 'NFC0001', 'Rituo Tag One', 19900, 'ARS', 100, true),
  ('tag-two', 'NFC0002', 'Rituo Tag Two', 34900, 'ARS', 100, true),
  ('tag-ten', 'NFC0003', 'Rituo Tag Ten', 149900, 'ARS', 50, true)
on conflict (slug) do nothing;
