import { Injectable } from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import { EntityManager } from "typeorm";
import { IOrderEventsRepository } from "../../../../core/adapters/repositories/orderEvents/IOrderEventsRepository";
import { CreateOrderEventData } from "../../../../core/entities/orderEvents/OrderEvent";

@Injectable()
export class SQLOrderEventsRepository implements IOrderEventsRepository {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async append(data: CreateOrderEventData): Promise<void> {
    await this.entityManager.query(
      `
        insert into checkout_order_events (order_id, event_type, payload)
        values ($1, $2, $3)
      `,
      [data.orderId, data.eventType, JSON.stringify(data.payload)],
    );
  }
}
