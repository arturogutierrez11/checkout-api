import { Module } from "@nestjs/common";
import { HealthController } from "../controllers/health/HealthController";

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
