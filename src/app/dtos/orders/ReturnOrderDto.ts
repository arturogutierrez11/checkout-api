import { IsOptional, IsString, MaxLength } from "class-validator";

export class ReturnOrderDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}
