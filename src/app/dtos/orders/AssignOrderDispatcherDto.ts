import { IsIn, IsOptional } from "class-validator";
import { DISPATCHERS } from "../../../core/entities/orders/dispatchers";

export class AssignOrderDispatcherDto {
  /** Omit or send null to unassign. */
  @IsOptional()
  @IsIn(DISPATCHERS)
  dispatcher?: string | null;
}
