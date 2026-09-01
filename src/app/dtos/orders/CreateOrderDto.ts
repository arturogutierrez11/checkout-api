import { Type } from "class-transformer";
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from "class-validator";

export class CustomerDto {
  @IsString() @MaxLength(60) firstName!: string;
  @IsString() @MaxLength(60) lastName!: string;
  @IsEmail() @MaxLength(160) email!: string;
  @IsString() @MaxLength(30) phone!: string;
}

export class ShippingAddressDto {
  @IsString() @MaxLength(160) address!: string;
  @IsString() @MaxLength(80) city!: string;
  @IsString() @MaxLength(80) province!: string;
  @IsString() @MaxLength(12) postalCode!: string;
}

export class BillingDto {
  @IsString()
  @Matches(/^\d{7,8}$/, { message: "dni must be 7-8 digits" })
  dni!: string;

  @IsBoolean() useShippingAddress!: boolean;

  @ValidateIf((dto: BillingDto) => dto.useShippingAddress === false)
  @IsString()
  @MaxLength(160)
  address?: string;

  @ValidateIf((dto: BillingDto) => dto.useShippingAddress === false)
  @IsString()
  @MaxLength(80)
  city?: string;

  @ValidateIf((dto: BillingDto) => dto.useShippingAddress === false)
  @IsString()
  @MaxLength(80)
  province?: string;

  @ValidateIf((dto: BillingDto) => dto.useShippingAddress === false)
  @IsString()
  @MaxLength(12)
  postalCode?: string;

  @IsBoolean() isBusinessPurchase!: boolean;

  @ValidateIf((dto: BillingDto) => dto.isBusinessPurchase === true)
  @IsString()
  @Matches(/^\d{2}-?\d{8}-?\d{1}$/, { message: "cuit must be a valid CUIT" })
  cuit?: string;

  @ValidateIf((dto: BillingDto) => dto.isBusinessPurchase === true)
  @IsString()
  @MaxLength(160)
  businessName?: string;
}

export class TrackingDto {
  @IsOptional() @IsString() fbp?: string;
  @IsOptional() @IsString() fbc?: string;
  @IsOptional() @IsString() clientIpAddress?: string;
  @IsOptional() @IsString() clientUserAgent?: string;
}

export class CreateOrderDto {
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

  @IsOptional()
  @ValidateNested()
  @Type(() => TrackingDto)
  tracking?: TrackingDto;
}
