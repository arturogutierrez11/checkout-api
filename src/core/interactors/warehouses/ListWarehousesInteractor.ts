import { IWarehousesRepository } from "../../adapters/repositories/warehouses/IWarehousesRepository";
import { Warehouse } from "../../entities/warehouses/Warehouse";

export class ListWarehousesInteractor {
  constructor(private readonly warehousesRepository: IWarehousesRepository) {}

  execute(): Promise<Warehouse[]> {
    return this.warehousesRepository.listActive();
  }
}
