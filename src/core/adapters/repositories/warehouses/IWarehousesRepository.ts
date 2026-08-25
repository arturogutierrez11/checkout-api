import {
  CreateWarehouseData,
  Warehouse,
} from "../../../entities/warehouses/Warehouse";

export const WAREHOUSES_REPOSITORY = Symbol("WAREHOUSES_REPOSITORY");

export interface IWarehousesRepository {
  listActive(): Promise<Warehouse[]>;
  getById(id: string): Promise<Warehouse | null>;
  getBySlug(slug: string): Promise<Warehouse | null>;
  create(data: CreateWarehouseData): Promise<Warehouse>;
}
