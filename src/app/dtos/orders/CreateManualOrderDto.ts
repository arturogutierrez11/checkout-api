import { Type } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";

/**
 * Manual sales are entered by the admin, sometimes with incomplete data
 * (e.g. a walk-in cash sale with no email on hand) — every field here is
 * optional, unlike the public checkout's strict DTOs.
 */
export class ManualCustomerDto {
  @IsOptional() @IsString() @MaxLength(60) firstName?: string;
  @IsOptional() @IsString() @MaxLength(60) lastName?: string;
  @IsOptional() @IsString() @MaxLength(160) email?: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
}

export class ManualShippingAddressDto {
  @IsOptional() @IsString() @MaxLength(160) address?: string;
  @IsOptional() @IsString() @MaxLength(80) city?: string;
  @IsOptional() @IsString() @MaxLength(80) province?: string;
  @IsOptional() @IsString() @MaxLength(12) postalCode?: string;
}

export class ManualBillingDto {
  @IsOptional() @IsString() @MaxLength(20) dni?: string;
  @IsOptional() @IsBoolean() useShippingAddress?: boolean;
  @IsOptional() @IsString() @MaxLength(160) address?: string;
  @IsOptional() @IsString() @MaxLength(80) city?: string;
  @IsOptional() @IsString() @MaxLength(80) province?: string;
  @IsOptional() @IsString() @MaxLength(12) postalCode?: string;
  @IsOptional() @IsBoolean() isBusinessPurchase?: boolean;
  @IsOptional() @IsString() @MaxLength(20) cuit?: string;
  @IsOptional() @IsString() @MaxLength(160) businessName?: string;
}

export class CreateManualOrderDto {
  @IsString() @MaxLength(60) productSlug!: string;

  @IsInt() @Min(1) @Max(20) quantity!: number;

  @IsIn(["standard", "express"]) shippingMethod!: "standard" | "express";

  @ValidateNested()
  @Type(() => ManualCustomerDto)
  customer!: ManualCustomerDto;

  @ValidateNested()
  @Type(() => ManualShippingAddressDto)
  shippingAddress!: ManualShippingAddressDto;

  @ValidateNested()
  @Type(() => ManualBillingDto)
  billing!: ManualBillingDto;

  @IsString()
  @MaxLength(60)
  manualPaymentMethod!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  manualPaymentNote?: string;

  /** Overrides the catalog price per unit — e.g. a discount given by hand. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPriceOverride?: number;
}
