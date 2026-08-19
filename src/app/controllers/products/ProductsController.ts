import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import {
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { ProductResponseDto } from "../../dtos/products/ProductResponseDto";
import { UpdateProductPriceDto } from "../../dtos/products/UpdateProductPriceDto";
import { ProductStockResponseDto } from "../../dtos/inventory/ProductStockResponseDto";
import { CheckoutInternalGuard } from "../../services/checkoutInternalAuth/guards/CheckoutInternalGuard";
import { ProductsService } from "../../services/products/ProductsService";

@ApiTags("products")
@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: "List active products" })
  @ApiResponse({ status: 200, type: [ProductResponseDto] })
  async list(): Promise<ProductResponseDto[]> {
    const products = await this.productsService.list();
    return products.map((product) => ProductResponseDto.fromEntity(product));
  }

  @Get("all")
  @UseGuards(CheckoutInternalGuard)
  @ApiHeader({
    name: "x-internal-api-key",
    required: true,
    description: "Internal API key",
  })
  @ApiUnauthorizedResponse({
    description: "Missing or invalid internal API key",
  })
  @ApiOperation({
    summary:
      "List every SKU (commercial and internal) with id and price — admin only",
  })
  @ApiResponse({ status: 200, type: [ProductStockResponseDto] })
  async listAll(): Promise<ProductStockResponseDto[]> {
    const products = await this.productsService.listAll();
    return products.map((product) =>
      ProductStockResponseDto.fromEntity(product),
    );
  }

  @Patch(":id/price")
  @UseGuards(CheckoutInternalGuard)
  @ApiHeader({
    name: "x-internal-api-key",
    required: true,
    description: "Internal API key",
  })
  @ApiUnauthorizedResponse({
    description: "Missing or invalid internal API key",
  })
  @ApiOperation({ summary: "Update a product's price (admin only)" })
  @ApiResponse({ status: 200, type: ProductStockResponseDto })
  async updatePrice(
    @Param("id") id: string,
    @Body() body: UpdateProductPriceDto,
  ): Promise<ProductStockResponseDto> {
    const product = await this.productsService.updatePrice(id, body.price);
    return ProductStockResponseDto.fromEntity(product);
  }
}
