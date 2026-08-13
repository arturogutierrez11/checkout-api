import { ApiProperty } from "@nestjs/swagger";
import { Order } from "../../../core/entities/orders/Order";
import { requiredDateISOString } from "../common/dateResponse";

export class OrderResponseDto {
  @ApiProperty() id!: string;

  @ApiProperty() productSku!: string;
  @ApiProperty() productName!: string;
  @ApiProperty() unitPrice!: number;
  @ApiProperty() quantity!: number;
  @ApiProperty() currency!: string;
  @ApiProperty() subtotal!: number;

  @ApiProperty() shippingMethod!: string;
  @ApiProperty() shippingPrice!: number;
  @ApiProperty() total!: number;

  @ApiProperty() status!: string;

  @ApiProperty() customerFirstName!: string;
  @ApiProperty() customerLastName!: string;
  @ApiProperty() customerEmail!: string;
  @ApiProperty() customerPhone!: string;

  @ApiProperty() shippingAddress!: string;
  @ApiProperty() shippingCity!: string;
  @ApiProperty() shippingProvince!: string;
  @ApiProperty() shippingPostalCode!: string;

  @ApiProperty({ nullable: true }) mpPaymentId!: string | null;
  @ApiProperty({ nullable: true }) mpPaymentStatus!: string | null;

  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;

  static fromEntity(order: Order): OrderResponseDto {
    return {
      id: order.id,
      productSku: order.productSku,
      productName: order.productName,
      unitPrice: order.unitPrice,
      quantity: order.quantity,
      currency: order.currency,
      subtotal: order.subtotal,
      shippingMethod: order.shippingMethod,
      shippingPrice: order.shippingPrice,
      total: order.total,
      status: order.status,
      customerFirstName: order.customerFirstName,
      customerLastName: order.customerLastName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      shippingAddress: order.shippingAddress,
      shippingCity: order.shippingCity,
      shippingProvince: order.shippingProvince,
      shippingPostalCode: order.shippingPostalCode,
      mpPaymentId: order.mpPaymentId,
      mpPaymentStatus: order.mpPaymentStatus,
      createdAt: requiredDateISOString(order.createdAt, "createdAt"),
      updatedAt: requiredDateISOString(order.updatedAt, "updatedAt"),
    };
  }
}
