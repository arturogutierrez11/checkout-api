import { Global, Module } from "@nestjs/common";
import { IdempotencyService } from "../../services/idempotency/IdempotencyService";

@Global()
@Module({
  providers: [IdempotencyService],
  exports: [IdempotencyService],
})
export class IdempotencyModule {}
