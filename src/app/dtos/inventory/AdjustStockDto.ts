import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from "class-validator";

export class AdjustStockDto {
  @IsString()
  sku!: string;

  @IsString()
  warehouseId!: string;

  @IsInt()
  @Min(0)
  newStock!: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;

  @IsOptional()
  @IsDateString()
  occurredAt?: string;
}
