import {
  IProductStockRepository,
  ProductWarehouseStock,
} from "../../adapters/repositories/productStock/IProductStockRepository";

export class ListProductStockByWarehouseInteractor {
  constructor(
    private readonly productStockRepository: IProductStockRepository,
  ) {}

  execute(productId: string): Promise<ProductWarehouseStock[]> {
    return this.productStockRepository.listByProduct(productId);
  }
}
