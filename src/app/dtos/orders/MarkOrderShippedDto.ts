import { IsOptional, IsString, MaxLength } from "class-validator";

export class MarkOrderShippedDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  carrier?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  trackingNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  labelUrl?: string;
}
