import { IInventoryMovementsRepository } from "../../adapters/repositories/inventoryMovements/IInventoryMovementsRepository";
import { InventoryMovement } from "../../entities/inventoryMovements/InventoryMovement";

export interface ListInventoryMovementsFilter {
  productId?: string;
  limit: number;
  offset: number;
}

export class ListInventoryMovementsInteractor {
  constructor(
    private readonly inventoryMovementsRepository: IInventoryMovementsRepository,
  ) {}

  execute(filter: ListInventoryMovementsFilter): Promise<InventoryMovement[]> {
    if (filter.productId) {
      return this.inventoryMovementsRepository.listByProduct(
        filter.productId,
        filter.limit,
        filter.offset,
      );
    }

    return this.inventoryMovementsRepository.listAll(
      filter.limit,
      filter.offset,
    );
  }
}
