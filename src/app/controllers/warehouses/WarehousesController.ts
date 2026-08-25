import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import {
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { CreateWarehouseDto } from "../../dtos/warehouses/CreateWarehouseDto";
import { WarehouseResponseDto } from "../../dtos/warehouses/WarehouseResponseDto";
import { CheckoutInternalGuard } from "../../services/checkoutInternalAuth/guards/CheckoutInternalGuard";
import { WarehousesService } from "../../services/warehouses/WarehousesService";

@ApiTags("warehouses")
@Controller("warehouses")
@UseGuards(CheckoutInternalGuard)
@ApiHeader({
  name: "x-internal-api-key",
  required: true,
  description: "Internal API key",
})
@ApiUnauthorizedResponse({ description: "Missing or invalid internal API key" })
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Get()
  @ApiOperation({ summary: "List active warehouses/depósitos" })
  @ApiResponse({ status: 200, type: [WarehouseResponseDto] })
  async list(): Promise<WarehouseResponseDto[]> {
    const warehouses = await this.warehousesService.list();
    return warehouses.map((warehouse) =>
      WarehouseResponseDto.fromEntity(warehouse),
    );
  }

  @Post()
  @ApiOperation({
    summary:
      "Register a new depósito: creates the pickup address in Zipnova and stores it locally",
  })
  @ApiResponse({ status: 201, type: WarehouseResponseDto })
  async create(
    @Body() body: CreateWarehouseDto,
  ): Promise<WarehouseResponseDto> {
    const warehouse = await this.warehousesService.create(body);
    return WarehouseResponseDto.fromEntity(warehouse);
  }
}
