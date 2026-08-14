import { Injectable } from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import { EntityManager } from "typeorm";
import { IInventoryMovementsRepository } from "../../../../core/adapters/repositories/inventoryMovements/IInventoryMovementsRepository";
import {
  InventoryMovement,
  MovementType,
  RecordInventoryMovementData,
} from "../../../../core/entities/inventoryMovements/InventoryMovement";

interface InventoryMovementRow {
  id: string;
  productId: string;
  movementType: MovementType;
  quantityDelta: number;
  stockAfter: number;
  orderId: string | null;
  note: string | null;
  occurredAt: Date | string;
  createdAt: Date | string;
}

const SELECT_COLUMNS = `
  id,
  product_id as "productId",
  movement_type as "movementType",
  quantity_delta as "quantityDelta",
  stock_after as "stockAfter",
  order_id as "orderId",
  note,
  occurred_at as "occurredAt",
  created_at as "createdAt"
`;

@Injectable()
export class SQLInventoryMovementsRepository implements IInventoryMovementsRepository {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async record(data: RecordInventoryMovementData): Promise<InventoryMovement> {
    const rows = await this.queryRows<InventoryMovementRow>(
      `
        insert into checkout_inventory_movements
          (product_id, movement_type, quantity_delta, stock_after, order_id, note, occurred_at)
        values ($1, $2, $3, $4, $5, $6, coalesce($7, now()))
        returning ${SELECT_COLUMNS}
      `,
      [
        data.productId,
        data.movementType,
        data.quantityDelta,
        data.stockAfter,
        data.orderId ?? null,
        data.note ?? null,
        data.occurredAt ?? null,
      ],
    );

    return this.mapRowToMovement(rows[0]);
  }

  async listByProduct(
    productId: string,
    limit: number,
    offset: number,
  ): Promise<InventoryMovement[]> {
    const rows = await this.queryRows<InventoryMovementRow>(
      `
        select ${SELECT_COLUMNS}
        from checkout_inventory_movements
        where product_id = $1
        order by occurred_at desc, created_at desc
        limit $2 offset $3
      `,
      [productId, limit, offset],
    );

    return rows.map((row) => this.mapRowToMovement(row));
  }

  async listByOrder(orderId: string): Promise<InventoryMovement[]> {
    const rows = await this.queryRows<InventoryMovementRow>(
      `
        select ${SELECT_COLUMNS}
        from checkout_inventory_movements
        where order_id = $1
        order by occurred_at desc, created_at desc
      `,
      [orderId],
    );

    return rows.map((row) => this.mapRowToMovement(row));
  }

  async listAll(limit: number, offset: number): Promise<InventoryMovement[]> {
    const rows = await this.queryRows<InventoryMovementRow>(
      `
        select ${SELECT_COLUMNS}
        from checkout_inventory_movements
        order by occurred_at desc, created_at desc
        limit $1 offset $2
      `,
      [limit, offset],
    );

    return rows.map((row) => this.mapRowToMovement(row));
  }

  private mapRowToMovement(row: InventoryMovementRow): InventoryMovement {
    return {
      id: row.id,
      productId: row.productId,
      movementType: row.movementType,
      quantityDelta: row.quantityDelta,
      stockAfter: row.stockAfter,
      orderId: row.orderId,
      note: row.note,
      occurredAt: this.toDate(row.occurredAt),
      createdAt: this.toDate(row.createdAt),
    };
  }

  private toDate(value: unknown): Date {
    const date = value instanceof Date ? value : new Date(String(value));

    if (Number.isNaN(date.getTime())) {
      throw new Error("Invalid inventory movement date");
    }

    return date;
  }

  private async queryRows<T>(sql: string, params: unknown[]): Promise<T[]> {
    const result: unknown = await this.entityManager.query(sql, params);

    if (
      Array.isArray(result) &&
      result.length === 2 &&
      Array.isArray(result[0]) &&
      typeof result[1] === "number"
    ) {
      return result[0] as T[];
    }

    return result as T[];
  }
}
