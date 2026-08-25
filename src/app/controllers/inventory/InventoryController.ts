import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import {
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { AdjustStockDto } from "../../dtos/inventory/AdjustStockDto";
import { InventoryMovementResponseDto } from "../../dtos/inventory/InventoryMovementResponseDto";
import { ProductStockResponseDto } from "../../dtos/inventory/ProductStockResponseDto";
import { RecordGiftDto } from "../../dtos/inventory/RecordGiftDto";
import { RestockDto } from "../../dtos/inventory/RestockDto";
import { CheckoutInternalGuard } from "../../services/checkoutInternalAuth/guards/CheckoutInternalGuard";
import { InventoryService } from "../../services/inventory/InventoryService";

@ApiTags("inventory")
@Controller("inventory")
@UseGuards(CheckoutInternalGuard)
@ApiHeader({
  name: "x-internal-api-key",
  required: true,
  description: "Internal API key",
})
@ApiUnauthorizedResponse({ description: "Missing or invalid internal API key" })
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get("products")
  @ApiOperation({
    summary:
      "List every SKU (including internal ones) with its stock broken down by warehouse",
  })
  @ApiResponse({ status: 200, type: [ProductStockResponseDto] })
  async listProducts(): Promise<ProductStockResponseDto[]> {
    const products = await this.inventoryService.listProducts();
    return products.map(({ product, stockByWarehouse }) =>
      ProductStockResponseDto.fromEntity(product, stockByWarehouse),
    );
  }

  @Get("movements")
  @ApiOperation({
    summary: "List stock movements, optionally filtered by product",
  })
  @ApiResponse({ status: 200, type: [InventoryMovementResponseDto] })
  async listMovements(
    @Query("productId") productId?: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ): Promise<InventoryMovementResponseDto[]> {
    const movements = await this.inventoryService.listMovements({
      productId,
      limit: Math.min(Number(limit) || 50, 200),
      offset: Number(offset) || 0,
    });

    return movements.map((movement) =>
      InventoryMovementResponseDto.fromEntity(movement),
    );
  }

  @Post("restock")
  @ApiOperation({
    summary: "Enter new merchandise for a SKU (cards or packaging)",
  })
  @ApiResponse({ status: 201, type: InventoryMovementResponseDto })
  async restock(
    @Body() body: RestockDto,
  ): Promise<InventoryMovementResponseDto> {
    const movement = await this.inventoryService.restock({
      sku: body.sku,
      warehouseId: body.warehouseId,
      quantity: body.quantity,
      note: body.note ?? null,
      occurredAt: body.occurredAt ? new Date(body.occurredAt) : undefined,
    });

    return InventoryMovementResponseDto.fromEntity(movement);
  }

  @Post("gifts")
  @ApiOperation({
    summary: "Record a gift/donation, subtracting stock outside of a sale",
  })
  @ApiResponse({ status: 201, type: InventoryMovementResponseDto })
  async recordGift(
    @Body() body: RecordGiftDto,
  ): Promise<InventoryMovementResponseDto> {
    const movement = await this.inventoryService.recordGift({
      sku: body.sku,
      warehouseId: body.warehouseId,
      quantity: body.quantity,
      occurredAt: new Date(body.occurredAt),
      note: body.note ?? null,
    });

    return InventoryMovementResponseDto.fromEntity(movement);
  }

  @Post("adjustments")
  @ApiOperation({
    summary: "Correct a SKU's stock at a warehouse to match a physical count",
  })
  @ApiResponse({ status: 201, type: InventoryMovementResponseDto })
  async adjustStock(
    @Body() body: AdjustStockDto,
  ): Promise<InventoryMovementResponseDto> {
    const movement = await this.inventoryService.adjustStock({
      sku: body.sku,
      warehouseId: body.warehouseId,
      newStock: body.newStock,
      note: body.note ?? null,
      occurredAt: body.occurredAt ? new Date(body.occurredAt) : undefined,
    });

    return InventoryMovementResponseDto.fromEntity(movement);
  }
}
