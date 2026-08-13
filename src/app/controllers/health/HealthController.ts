import { Controller, Get } from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import { EntityManager } from "typeorm";
import { env } from "../../../config/env";

interface DatabaseHealthRow {
  ok: number;
}

@Controller("health")
export class HealthController {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  @Get()
  health() {
    return {
      status: "ok",
      service: env.serviceName,
    };
  }

  @Get("db")
  async databaseHealth() {
    const rows = await this.queryRows<DatabaseHealthRow>("select 1 as ok");

    return {
      status: rows[0]?.ok === 1 ? "ok" : "error",
      database: rows[0]?.ok === 1 ? "connected" : "unavailable",
    };
  }

  private async queryRows<T>(
    sql: string,
    params: unknown[] = [],
  ): Promise<T[]> {
    const result: unknown = await this.entityManager.query(sql, params);
    return result as T[];
  }
}
