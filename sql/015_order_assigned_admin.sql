-- Responsable de despacho: referencia liviana (sin FK, mismo criterio que
-- el resto de checkout_* respecto de las tablas compartidas users/admin_users)
-- a la cuenta de admin que despacha cada orden.
alter table checkout_orders
  add column if not exists assigned_admin_id uuid;
