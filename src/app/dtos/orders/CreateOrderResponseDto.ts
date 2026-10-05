import { ApiProperty } from "@nestjs/swagger";

export class CreateOrderResponseDto {
  @ApiProperty() orderId!: string;
  @ApiProperty({ enum: ["mercadopago", "bank_transfer"] })
  paymentMethod!: "mercadopago" | "bank_transfer";
  @ApiProperty({ nullable: true }) initPoint!: string | null;
}
