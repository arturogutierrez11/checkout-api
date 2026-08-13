import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/DatabaseModule";
import { IdempotencyModule } from "./idempotency/IdempotencyModule";
import { ExternalServicesModule } from "./externalServices/ExternalServicesModule";
import { HealthModule } from "./health.module";
import { ProductsModule } from "./products/ProductsModule";
import { OrdersModule } from "./orders/OrdersModule";
import { MercadoPagoWebhookModule } from "./webhooks/MercadoPagoWebhookModule";

@Module({
  imports: [
    DatabaseModule,
    IdempotencyModule,
    ExternalServicesModule,
    HealthModule,
    ProductsModule,
    OrdersModule,
    MercadoPagoWebhookModule,
  ],
})
export class AppModule {}
