import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ProductResponseDto } from "../../dtos/products/ProductResponseDto";
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
}
