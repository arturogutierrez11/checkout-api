import { ApiProperty } from "@nestjs/swagger";
import { Product } from "../../../core/entities/products/Product";

export class ProductResponseDto {
  @ApiProperty() slug!: string;
  @ApiProperty() sku!: string;
  @ApiProperty() name!: string;
  @ApiProperty() price!: number;
  @ApiProperty() currency!: string;
  @ApiProperty() inStock!: boolean;

  static fromEntity(product: Product): ProductResponseDto {
    return {
      slug: product.slug,
      sku: product.sku,
      name: product.name,
      price: product.price,
      currency: product.currency,
      inStock: product.stock > 0,
    };
  }
}
