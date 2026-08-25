import { ApiProperty } from "@nestjs/swagger";
import { Order } from "../../../core/entities/orders/Order";
import {
  nullableDateISOString,
  requiredDateISOString,
} from "../common/dateResponse";

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

  @ApiProperty() billingDni!: string;
  @ApiProperty() billingUseShippingAddress!: boolean;
  @ApiProperty({ nullable: true }) billingAddress!: string | null;
  @ApiProperty({ nullable: true }) billingCity!: string | null;
  @ApiProperty({ nullable: true }) billingProvince!: string | null;
  @ApiProperty({ nullable: true }) billingPostalCode!: string | null;
  @ApiProperty() isBusinessPurchase!: boolean;
  @ApiProperty({ nullable: true }) billingCuit!: string | null;
  @ApiProperty({ nullable: true }) billingBusinessName!: string | null;

  @ApiProperty({ nullable: true }) mpPreferenceId!: string | null;
  @ApiProperty({ nullable: true }) mpPaymentId!: string | null;
  @ApiProperty({ nullable: true }) mpPaymentStatus!: string | null;
  @ApiProperty({ nullable: true }) mpPaymentStatusDetail!: string | null;

  @ApiProperty() salesChannel!: string;
  @ApiProperty({ nullable: true }) manualPaymentMethod!: string | null;
  @ApiProperty({ nullable: true }) manualPaymentNote!: string | null;

  @ApiProperty() shippingStatus!: string;
  @ApiProperty({ nullable: true }) shippingCarrier!: string | null;
  @ApiProperty({ nullable: true }) shippingTrackingNumber!: string | null;
  @ApiProperty({ nullable: true }) shippingLabelUrl!: string | null;
  @ApiProperty({ nullable: true }) shippedAt!: string | null;
  @ApiProperty({ nullable: true }) shippingRealCost!: number | null;
  @ApiProperty({ nullable: true }) shippingZipnovaShipmentId!: string | null;
  @ApiProperty({ nullable: true }) shippingZipnovaStatus!: string | null;

  @ApiProperty({ nullable: true }) invoiceStatus!: string | null;
  @ApiProperty({ nullable: true }) invoicedAt!: string | null;

  @ApiProperty({ nullable: true }) approvedAt!: string | null;
  @ApiProperty({ nullable: true }) emailSentAt!: string | null;

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
      billingDni: order.billingDni,
      billingUseShippingAddress: order.billingUseShippingAddress,
      billingAddress: order.billingAddress,
      billingCity: order.billingCity,
      billingProvince: order.billingProvince,
      billingPostalCode: order.billingPostalCode,
      isBusinessPurchase: order.isBusinessPurchase,
      billingCuit: order.billingCuit,
      billingBusinessName: order.billingBusinessName,
      mpPreferenceId: order.mpPreferenceId,
      mpPaymentId: order.mpPaymentId,
      mpPaymentStatus: order.mpPaymentStatus,
      mpPaymentStatusDetail: order.mpPaymentStatusDetail,
      salesChannel: order.salesChannel,
      manualPaymentMethod: order.manualPaymentMethod,
      manualPaymentNote: order.manualPaymentNote,
      shippingStatus: order.shippingStatus,
      shippingCarrier: order.shippingCarrier,
      shippingTrackingNumber: order.shippingTrackingNumber,
      shippingLabelUrl: order.shippingLabelUrl,
      shippedAt: nullableDateISOString(order.shippedAt),
      shippingRealCost: order.shippingRealCost,
      shippingZipnovaShipmentId: order.shippingZipnovaShipmentId,
      shippingZipnovaStatus: order.shippingZipnovaStatus,
      invoiceStatus: order.invoiceStatus,
      invoicedAt: nullableDateISOString(order.invoicedAt),
      approvedAt: nullableDateISOString(order.approvedAt),
      emailSentAt: nullableDateISOString(order.emailSentAt),
      createdAt: requiredDateISOString(order.createdAt, "createdAt"),
      updatedAt: requiredDateISOString(order.updatedAt, "updatedAt"),
    };
  }
}
