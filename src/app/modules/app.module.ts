import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/DatabaseModule";
import { IdempotencyModule } from "./idempotency/IdempotencyModule";
import { ExternalServicesModule } from "./externalServices/ExternalServicesModule";
import { HealthModule } from "./health.module";
import { ProductsModule } from "./products/ProductsModule";
import { OrdersModule } from "./orders/OrdersModule";
import { InventoryModule } from "./inventory/InventoryModule";
import { MercadoPagoWebhookModule } from "./webhooks/MercadoPagoWebhookModule";
import { ZipnovaWebhookModule } from "./webhooks/ZipnovaWebhookModule";

@Module({
  imports: [
    DatabaseModule,
    IdempotencyModule,
    ExternalServicesModule,
    HealthModule,
    ProductsModule,
    OrdersModule,
    InventoryModule,
    MercadoPagoWebhookModule,
    ZipnovaWebhookModule,
  ],
})
export class AppModule {}
