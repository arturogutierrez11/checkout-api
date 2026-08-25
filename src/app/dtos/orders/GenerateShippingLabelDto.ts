import { IsString } from "class-validator";

export class GenerateShippingLabelDto {
  @IsString()
  warehouseId!: string;
}
