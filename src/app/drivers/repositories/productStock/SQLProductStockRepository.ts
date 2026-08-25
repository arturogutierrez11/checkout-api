import { Injectable } from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import { EntityManager } from "typeorm";
import {
  IProductStockRepository,
  ProductWarehouseStock,
} from "../../../../core/adapters/repositories/productStock/IProductStockRepository";

interface WarehouseStockRow {
  warehouseId: string;
  warehouseSlug: string;
  warehouseName: string;
  stock: number;
}

@Injectable()
export class SQLProductStockRepository implements IProductStockRepository {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async decrementStock(
    productId: string,
    warehouseId: string,
    quantity: number,
  ): Promise<number | null> {
    const rows = await this.queryRows<{ stock: number }>(
      `
        update checkout_product_stock
        set stock = stock - $3, updated_at = now()
        where product_id = $1 and warehouse_id = $2 and stock >= $3
        returning stock
      `,
      [productId, warehouseId, quantity],
    );

    return rows[0] ? rows[0].stock : null;
  }

  async incrementStock(
    productId: string,
    warehouseId: string,
    quantity: number,
  ): Promise<number> {
    const rows = await this.queryRows<{ stock: number }>(
      `
        insert into checkout_product_stock (product_id, warehouse_id, stock)
        values ($1, $2, $3)
        on conflict (product_id, warehouse_id)
        do update set stock = checkout_product_stock.stock + $3, updated_at = now()
        returning stock
      `,
      [productId, warehouseId, quantity],
    );

    return rows[0].stock;
  }

  async getStock(productId: string, warehouseId: string): Promise<number> {
    const rows = await this.queryRows<{ stock: number }>(
      `
        select stock
        from checkout_product_stock
        where product_id = $1 and warehouse_id = $2
      `,
      [productId, warehouseId],
    );

    return rows[0] ? Number(rows[0].stock) : 0;
  }

  async listByProduct(productId: string): Promise<ProductWarehouseStock[]> {
    const rows = await this.queryRows<WarehouseStockRow>(
      `
        select
          w.id as "warehouseId",
          w.slug as "warehouseSlug",
          w.name as "warehouseName",
          coalesce(s.stock, 0) as stock
        from checkout_warehouses w
        left join checkout_product_stock s
          on s.warehouse_id = w.id and s.product_id = $1
        where w.is_active = true
        order by w.priority asc, w.created_at asc
      `,
      [productId],
    );

    return rows.map((row) => ({
      warehouseId: row.warehouseId,
      warehouseSlug: row.warehouseSlug,
      warehouseName: row.warehouseName,
      stock: Number(row.stock),
    }));
  }

  async getTotalStock(productId: string): Promise<number> {
    const rows = await this.queryRows<{ total: string }>(
      `
        select coalesce(sum(s.stock), 0) as total
        from checkout_product_stock s
        join checkout_warehouses w on w.id = s.warehouse_id
        where s.product_id = $1 and w.is_active = true
      `,
      [productId],
    );

    return Number(rows[0]?.total ?? 0);
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
