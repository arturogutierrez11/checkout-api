import { ApiProperty } from "@nestjs/swagger";
import { Warehouse } from "../../../core/entities/warehouses/Warehouse";

export class WarehouseResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ nullable: true }) addressStreet!: string | null;
  @ApiProperty({ nullable: true }) addressCity!: string | null;
  @ApiProperty({ nullable: true }) addressState!: string | null;
  @ApiProperty({ nullable: true }) addressZipcode!: string | null;
  @ApiProperty({ nullable: true }) addressPhone!: string | null;
  @ApiProperty({ nullable: true }) addressEmail!: string | null;
  @ApiProperty() priority!: number;
  @ApiProperty() isActive!: boolean;

  static fromEntity(warehouse: Warehouse): WarehouseResponseDto {
    return {
      id: warehouse.id,
      slug: warehouse.slug,
      name: warehouse.name,
      addressStreet: warehouse.addressStreet,
      addressCity: warehouse.addressCity,
      addressState: warehouse.addressState,
      addressZipcode: warehouse.addressZipcode,
      addressPhone: warehouse.addressPhone,
      addressEmail: warehouse.addressEmail,
      priority: warehouse.priority,
      isActive: warehouse.isActive,
    };
  }
}
