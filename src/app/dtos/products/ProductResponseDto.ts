import { ApiProperty } from "@nestjs/swagger";
import { Product } from "../../../core/entities/products/Product";

export class ProductResponseDto {
  @ApiProperty() slug!: string;
  @ApiProperty() sku!: string;
  @ApiProperty() name!: string;
  @ApiProperty() price!: number;
  @ApiProperty() currency!: string;
  @ApiProperty() inStock!: boolean;
  /** Tarjetas físicas que trae este SKU (1, 2, 10). */
  @ApiProperty() bundleUnits!: number;

  static fromEntity(product: Product): ProductResponseDto {
    return {
      slug: product.slug,
      sku: product.sku,
      name: product.name,
      price: product.price,
      currency: product.currency,
      inStock: product.stock > 0,
      bundleUnits: product.bundleUnits,
    };
  }
}
