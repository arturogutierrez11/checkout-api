-- Completa la dirección real del depósito Principal (solo para mostrar en el
-- panel — el origen en Zipnova ya está correcto desde antes, esto no lo toca).
update checkout_warehouses
set
  address_street = 'Bourdet 775',
  address_city = 'Bella Vista',
  address_state = 'Buenos Aires',
  address_zipcode = '1661',
  address_phone = '+541158479025'
where slug = 'principal';

-- Nuevo tipo de movimiento "adjustment": corrección manual de stock luego de
-- un conteo físico (no es venta, regalo ni ingreso de mercadería nueva).
alter table checkout_inventory_movements
  drop constraint if exists checkout_inventory_movements_movement_type_check;

alter table checkout_inventory_movements
  add constraint checkout_inventory_movements_movement_type_check
  check (movement_type in ('sale', 'cancellation', 'return', 'gift', 'restock', 'adjustment'));
