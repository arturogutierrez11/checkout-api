export class WarehouseNotFoundError extends Error {
  constructor(public readonly warehouseId: string) {
    super(`Warehouse not found or inactive: ${warehouseId}`);
    this.name = "WarehouseNotFoundError";
  }
}
