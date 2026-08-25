import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class CreateWarehouseDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  addressStreet!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20)
  addressStreetNumber!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  addressCity!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  addressState!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(20)
  addressZipcode!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(30)
  addressPhone!: string;

  @IsEmail()
  addressEmail!: string;
}
