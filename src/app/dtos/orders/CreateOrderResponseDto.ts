import { ApiProperty } from "@nestjs/swagger";

export class CreateOrderResponseDto {
  @ApiProperty() orderId!: string;
  @ApiProperty() initPoint!: string;
}
