import { IsBoolean } from "class-validator";

export class SetInvoiceStatusDto {
  @IsBoolean()
  invoiced!: boolean;
}
