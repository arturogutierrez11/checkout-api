import { Type } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { BillingDto, CustomerDto, ShippingAddressDto } from "./CreateOrderDto";

export class CreateManualOrderDto {
  @IsString() @MaxLength(60) productSlug!: string;

  @IsInt() @Min(1) @Max(20) quantity!: number;

  @IsIn(["standard", "express"]) shippingMethod!: "standard" | "express";

  @ValidateNested()
  @Type(() => CustomerDto)
  customer!: CustomerDto;

  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress!: ShippingAddressDto;

  @ValidateNested()
  @Type(() => BillingDto)
  billing!: BillingDto;

  @IsString()
  @MaxLength(60)
  manualPaymentMethod!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  manualPaymentNote?: string;
}
