import {
  Body,
  Controller,
  Get,
  Header,
  Headers,
  Param,
  Post,
  Query,
  StreamableFile,
  UseGuards,
} from "@nestjs/common";
import {
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { AssignOrderDispatcherDto } from "../../dtos/orders/AssignOrderDispatcherDto";
import { CreateManualOrderDto } from "../../dtos/orders/CreateManualOrderDto";
import { CreateOrderDto } from "../../dtos/orders/CreateOrderDto";
import { CreateOrderResponseDto } from "../../dtos/orders/CreateOrderResponseDto";
import { GenerateShippingLabelDto } from "../../dtos/orders/GenerateShippingLabelDto";
import { MarkOrderShippedDto } from "../../dtos/orders/MarkOrderShippedDto";
import { OrderResponseDto } from "../../dtos/orders/OrderResponseDto";
import { ReturnOrderDto } from "../../dtos/orders/ReturnOrderDto";
import { SetInvoiceStatusDto } from "../../dtos/orders/SetInvoiceStatusDto";
import { SetShippingStatusDto } from "../../dtos/orders/SetShippingStatusDto";
import { CheckoutInternalGuard } from "../../services/checkoutInternalAuth/guards/CheckoutInternalGuard";
import { OrdersService } from "../../services/orders/OrdersService";
import { DISPATCHERS } from "../../../core/entities/orders/dispatchers";
import type { OrderStatus } from "../../../core/entities/orders/Order";

@ApiTags("orders")
@Controller("orders")
@UseGuards(CheckoutInternalGuard)
@ApiHeader({
  name: "x-internal-api-key",
  required: true,
  description: "Internal API key",
})
@ApiUnauthorizedResponse({ description: "Missing or invalid internal API key" })
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: "Create an order and a Mercado Pago preference" })
  @ApiHeader({ name: "Idempotency-Key", required: true })
  @ApiResponse({ status: 201, type: CreateOrderResponseDto })
  async create(
    @Body() body: CreateOrderDto,
    @Headers("idempotency-key") idempotencyKey: string | undefined,
  ): Promise<CreateOrderResponseDto> {
    const result = await this.ordersService.create(
      {
        productSlug: body.productSlug,
        quantity: body.quantity,
        shippingMethod: body.shippingMethod,
        customer: body.customer,
        shippingAddress: body.shippingAddress,
        billing: {
          dni: body.billing.dni,
          useShippingAddress: body.billing.useShippingAddress,
          address: body.billing.address ?? null,
          city: body.billing.city ?? null,
          province: body.billing.province ?? null,
          postalCode: body.billing.postalCode ?? null,
          isBusinessPurchase: body.billing.isBusinessPurchase,
          cuit: body.billing.cuit ?? null,
          businessName: body.billing.businessName ?? null,
        },
      },
      idempotencyKey,
    );

    return result;
  }

  @Post("manual")
  @ApiOperation({
    summary:
      "Register a sale paid outside Mercado Pago (cash, transfer, etc.) — created already approved",
  })
  @ApiResponse({ status: 201, type: OrderResponseDto })
  async createManual(
    @Body() body: CreateManualOrderDto,
  ): Promise<OrderResponseDto> {
    const order = await this.ordersService.createManual({
      productSlug: body.productSlug,
      quantity: body.quantity,
      shippingMethod: body.shippingMethod,
      customer: body.customer,
      shippingAddress: body.shippingAddress,
      billing: {
        dni: body.billing.dni,
        useShippingAddress: body.billing.useShippingAddress,
        address: body.billing.address ?? null,
        city: body.billing.city ?? null,
        province: body.billing.province ?? null,
        postalCode: body.billing.postalCode ?? null,
        isBusinessPurchase: body.billing.isBusinessPurchase,
        cuit: body.billing.cuit ?? null,
        businessName: body.billing.businessName ?? null,
      },
      manualPaymentMethod: body.manualPaymentMethod,
      manualPaymentNote: body.manualPaymentNote ?? null,
      unitPriceOverride: body.unitPriceOverride,
    });

    return OrderResponseDto.fromEntity(order);
  }

  @Get("dispatchers")
  @ApiOperation({
    summary: "List the people eligible to be assigned to dispatch an order",
  })
  @ApiResponse({ status: 200, type: [String] })
  listDispatchers(): string[] {
    return [...DISPATCHERS];
  }

  @Get(":id")
  @ApiOperation({ summary: "Get an order by id" })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  async getById(@Param("id") id: string): Promise<OrderResponseDto> {
    const order = await this.ordersService.get(id);
    return OrderResponseDto.fromEntity(order);
  }

  @Get()
  @ApiOperation({ summary: "List orders" })
  @ApiResponse({ status: 200, type: [OrderResponseDto] })
  async list(
    @Query("status") status?: OrderStatus,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ): Promise<OrderResponseDto[]> {
    const orders = await this.ordersService.list({
      status,
      limit: Math.min(Number(limit) || 50, 200),
      offset: Number(offset) || 0,
    });

    return orders.map((order) => OrderResponseDto.fromEntity(order));
  }

  @Post(":id/cancel")
  @ApiOperation({ summary: "Cancel a pending order and release its stock" })
  @ApiResponse({ status: 201, type: OrderResponseDto })
  async cancel(@Param("id") id: string): Promise<OrderResponseDto> {
    const order = await this.ordersService.cancel(id);
    return OrderResponseDto.fromEntity(order);
  }

  @Post(":id/ship")
  @ApiOperation({ summary: "Mark an approved order as shipped" })
  @ApiResponse({ status: 201, type: OrderResponseDto })
  async ship(
    @Param("id") id: string,
    @Body() body: MarkOrderShippedDto,
  ): Promise<OrderResponseDto> {
    const order = await this.ordersService.ship(
      id,
      {
        carrier: body.carrier ?? null,
        trackingNumber: body.trackingNumber ?? null,
        labelUrl: body.labelUrl ?? null,
      },
      body.warehouseId,
    );
    return OrderResponseDto.fromEntity(order);
  }

  @Post(":id/shipping-label")
  @ApiOperation({
    summary:
      "Reserve stock at the given warehouse, then quote+create a Correo Argentino shipment via Zipnova (cheapest option) from that warehouse's origin",
  })
  @ApiResponse({ status: 201, type: OrderResponseDto })
  async generateShippingLabel(
    @Param("id") id: string,
    @Body() body: GenerateShippingLabelDto,
  ): Promise<OrderResponseDto> {
    const order = await this.ordersService.generateShippingLabel(
      id,
      body.warehouseId,
    );
    return OrderResponseDto.fromEntity(order);
  }

  @Post(":id/reserve-stock")
  @ApiOperation({
    summary:
      "Assign a depósito to an order and decrement its stock right away, independent of generating a label or marking it shipped",
  })
  @ApiResponse({ status: 201, type: OrderResponseDto })
  async reserveStock(
    @Param("id") id: string,
    @Body() body: GenerateShippingLabelDto,
  ): Promise<OrderResponseDto> {
    const order = await this.ordersService.reserveStock(id, body.warehouseId);
    return OrderResponseDto.fromEntity(order);
  }

  @Post(":id/assign-dispatcher")
  @ApiOperation({
    summary: "Assign (or unassign) who is responsible for dispatching an order",
  })
  @ApiResponse({ status: 201, type: OrderResponseDto })
  async assignDispatcher(
    @Param("id") id: string,
    @Body() body: AssignOrderDispatcherDto,
  ): Promise<OrderResponseDto> {
    const order = await this.ordersService.assignDispatcher(
      id,
      body.dispatcher ?? null,
    );
    return OrderResponseDto.fromEntity(order);
  }

  @Post(":id/shipping-label/reset")
  @ApiOperation({
    summary:
      "Undo a Zipnova shipment that got voided before it ever left the depósito — releases its reserved stock and clears the shipment so a new label can be generated",
  })
  @ApiResponse({ status: 201, type: OrderResponseDto })
  async resetShippingLabel(@Param("id") id: string): Promise<OrderResponseDto> {
    const order = await this.ordersService.resetShippingLabel(id);
    return OrderResponseDto.fromEntity(order);
  }

  @Get(":id/shipping-label")
  @ApiOperation({ summary: "Download the shipment's PDF label from Zipnova" })
  @Header("Content-Type", "application/pdf")
  async downloadShippingLabel(
    @Param("id") id: string,
  ): Promise<StreamableFile> {
    const label = await this.ordersService.downloadShippingLabel(id);
    return new StreamableFile(label.buffer, {
      type: label.contentType,
      disposition: `attachment; filename="etiqueta-${id.slice(0, 8)}.pdf"`,
    });
  }

  @Post(":id/resync")
  @ApiOperation({
    summary:
      "Re-check the order's payment status directly against Mercado Pago",
  })
  @ApiResponse({ status: 201, type: OrderResponseDto })
  async resync(@Param("id") id: string): Promise<OrderResponseDto> {
    const order = await this.ordersService.resync(id);
    return OrderResponseDto.fromEntity(order);
  }

  @Post(":id/shipping-status")
  @ApiOperation({
    summary:
      "Manually set the shipping status (pending_dispatch/dispatched/shipped/cancelled)",
  })
  @ApiResponse({ status: 201, type: OrderResponseDto })
  async setShippingStatus(
    @Param("id") id: string,
    @Body() body: SetShippingStatusDto,
  ): Promise<OrderResponseDto> {
    const order = await this.ordersService.setShippingStatus(id, body.status);
    return OrderResponseDto.fromEntity(order);
  }

  @Post(":id/invoice-status")
  @ApiOperation({ summary: "Manually mark an order as invoiced or not" })
  @ApiResponse({ status: 201, type: OrderResponseDto })
  async setInvoiceStatus(
    @Param("id") id: string,
    @Body() body: SetInvoiceStatusDto,
  ): Promise<OrderResponseDto> {
    const order = await this.ordersService.setInvoiceStatus(id, body.invoiced);
    return OrderResponseDto.fromEntity(order);
  }

  @Post(":id/return")
  @ApiOperation({
    summary: "Register a return for a paid order and release its stock",
  })
  @ApiResponse({ status: 201, type: OrderResponseDto })
  async returnOrder(
    @Param("id") id: string,
    @Body() body: ReturnOrderDto,
  ): Promise<OrderResponseDto> {
    const order = await this.ordersService.returnOrder(id, body.note);
    return OrderResponseDto.fromEntity(order);
  }
}
