import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from "class-validator";

export class RecordGiftDto {
  @IsString()
  sku!: string;

  @IsString()
  warehouseId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsDateString()
  occurredAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}
