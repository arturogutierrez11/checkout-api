-- checkout.api tiene su propia base, separada de auth.api — no podemos
-- referenciar admin_users/users de otra base. Con solo dos personas
-- despachando, alcanza con un texto validado contra una lista fija en
-- código en vez de una referencia a una cuenta real.
alter table checkout_orders
  drop column if exists assigned_admin_id;

alter table checkout_orders
  add column if not exists assigned_dispatcher text;
