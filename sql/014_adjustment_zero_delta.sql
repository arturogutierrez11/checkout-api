-- Un ajuste por conteo puede confirmar que el stock coincide (delta 0) — ese
-- caso sigue siendo un movimiento válido para dejar registro del conteo,
-- aunque no cambie nada. El resto de los tipos (venta, regalo, ingreso,
-- etc.) siguen exigiendo un delta distinto de cero.
alter table checkout_inventory_movements
  drop constraint if exists checkout_inventory_movements_quantity_delta_check;

alter table checkout_inventory_movements
  add constraint checkout_inventory_movements_quantity_delta_check
  check (quantity_delta <> 0 or movement_type = 'adjustment');
