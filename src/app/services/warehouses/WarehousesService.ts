import { Injectable } from "@nestjs/common";
import {
  CreateWarehouseInput,
  CreateWarehouseInteractor,
} from "../../../core/interactors/warehouses/CreateWarehouseInteractor";
import { ListWarehousesInteractor } from "../../../core/interactors/warehouses/ListWarehousesInteractor";
import { Warehouse } from "../../../core/entities/warehouses/Warehouse";

@Injectable()
export class WarehousesService {
  constructor(
    private readonly listWarehousesInteractor: ListWarehousesInteractor,
    private readonly createWarehouseInteractor: CreateWarehouseInteractor,
  ) {}

  list(): Promise<Warehouse[]> {
    return this.listWarehousesInteractor.execute();
  }

  create(input: CreateWarehouseInput): Promise<Warehouse> {
    return this.createWarehouseInteractor.execute(input);
  }
}
