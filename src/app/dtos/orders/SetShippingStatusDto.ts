import { IsIn } from "class-validator";

export class SetShippingStatusDto {
  @IsIn(["pending_dispatch", "dispatched", "shipped", "cancelled"])
  status!: "pending_dispatch" | "dispatched" | "shipped" | "cancelled";
}
