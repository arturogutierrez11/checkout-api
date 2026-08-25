import { ApiProperty } from "@nestjs/swagger";
import { ProductWarehouseStock } from "../../../core/adapters/repositories/productStock/IProductStockRepository";
import { Product } from "../../../core/entities/products/Product";

export class ProductWarehouseStockDto {
  @ApiProperty() warehouseId!: string;
  @ApiProperty() warehouseSlug!: string;
  @ApiProperty() warehouseName!: string;
  @ApiProperty() stock!: number;
}

export class ProductStockResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() sku!: string;
  @ApiProperty() name!: string;
  @ApiProperty() price!: number;
  @ApiProperty() currency!: string;
  @ApiProperty() stock!: number;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() isInternal!: boolean;
  @ApiProperty({ type: [ProductWarehouseStockDto] })
  stockByWarehouse!: ProductWarehouseStockDto[];

  static fromEntity(
    product: Product,
    stockByWarehouse: ProductWarehouseStock[] = [],
  ): ProductStockResponseDto {
    return {
      id: product.id,
      slug: product.slug,
      sku: product.sku,
      name: product.name,
      price: product.price,
      currency: product.currency,
      stock: product.stock,
      isActive: product.isActive,
      isInternal: product.isInternal,
      stockByWarehouse,
    };
  }
}
