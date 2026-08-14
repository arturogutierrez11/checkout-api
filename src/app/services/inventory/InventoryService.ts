import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InsufficientStockError } from "../../../core/interactors/orders/InsufficientStockError";
import { ProductNotFoundError } from "../../../core/interactors/orders/ProductNotFoundError";
import {
  ListInventoryMovementsFilter,
  ListInventoryMovementsInteractor,
} from "../../../core/interactors/inventory/ListInventoryMovementsInteractor";
import {
  RecordGiftInput,
  RecordGiftInteractor,
} from "../../../core/interactors/inventory/RecordGiftInteractor";
import {
  RestockProductInput,
  RestockProductInteractor,
} from "../../../core/interactors/inventory/RestockProductInteractor";
import { ListAllProductsInteractor } from "../../../core/interactors/products/ListAllProductsInteractor";
import { InventoryMovement } from "../../../core/entities/inventoryMovements/InventoryMovement";
import { Product } from "../../../core/entities/products/Product";
import { ApiErrorCode, apiError } from "../../errors/ApiErrorResponse";

@Injectable()
export class InventoryService {
  constructor(
    private readonly listAllProductsInteractor: ListAllProductsInteractor,
    private readonly listInventoryMovementsInteractor: ListInventoryMovementsInteractor,
    private readonly restockProductInteractor: RestockProductInteractor,
    private readonly recordGiftInteractor: RecordGiftInteractor,
  ) {}

  async listProducts(): Promise<Product[]> {
    const products = await this.listAllProductsInteractor.execute();
    // Only the physical pools (cards, packaging) are inventory-tracked; the
    // commercial bundles (tag-one/two/ten) are just price points on top.
    return products.filter((product) => product.isInternal);
  }

  listMovements(
    filter: ListInventoryMovementsFilter,
  ): Promise<InventoryMovement[]> {
    return this.listInventoryMovementsInteractor.execute(filter);
  }

  async restock(input: RestockProductInput): Promise<InventoryMovement> {
    try {
      return await this.restockProductInteractor.execute(input);
    } catch (err) {
      if (err instanceof ProductNotFoundError) {
        throw new NotFoundException(
          apiError(ApiErrorCode.productNotFound, err.message),
        );
      }
      throw err;
    }
  }

  async recordGift(input: RecordGiftInput): Promise<InventoryMovement> {
    try {
      return await this.recordGiftInteractor.execute(input);
    } catch (err) {
      if (err instanceof ProductNotFoundError) {
        throw new NotFoundException(
          apiError(ApiErrorCode.productNotFound, err.message),
        );
      }
      if (err instanceof InsufficientStockError) {
        throw new ConflictException(
          apiError(ApiErrorCode.insufficientStock, err.message),
        );
      }
      throw err;
    }
  }
}
