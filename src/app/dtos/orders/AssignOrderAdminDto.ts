import { IsOptional, IsString } from "class-validator";

export class AssignOrderAdminDto {
  /** Omit or send null to unassign. */
  @IsOptional()
  @IsString()
  adminUserId?: string | null;
}
