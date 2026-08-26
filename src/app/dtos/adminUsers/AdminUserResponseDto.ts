import { ApiProperty } from "@nestjs/swagger";
import { AdminUser } from "../../../core/entities/adminUsers/AdminUser";

export class AdminUserResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty({ nullable: true }) email!: string | null;
  @ApiProperty({ nullable: true }) displayName!: string | null;

  static fromEntity(admin: AdminUser): AdminUserResponseDto {
    return {
      id: admin.id,
      email: admin.email,
      displayName: admin.displayName,
    };
  }
}
