import { Injectable } from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import { EntityManager } from "typeorm";
import { IProductsRepository } from "../../../../core/adapters/repositories/products/IProductsRepository";
import { Product } from "../../../../core/entities/products/Product";

interface ProductRow {
  id: string;
  slug: string;
  sku: string;
  name: string;
  price: string;
  currency: string;
  stock: number;
  isActive: boolean;
  isInternal: boolean;
  bundleUnits: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

@Injectable()
export class SQLProductsRepository implements IProductsRepository {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  /**
   * `stock` is no longer a stored column read directly — it's the live sum
   * of `checkout_product_stock` across every active warehouse, joined in
   * here so every existing call site that reads `Product.stock` keeps
   * getting a correct cross-warehouse total without any code changes.
   */
  private static readonly BASE_SELECT = `
    select
      p.id, p.slug, p.sku, p.name, p.price, p.currency,
      -- sum() over int returns bigint, which node-postgres returns as a
      -- string — cast back to int so callers get a real number.
      coalesce(s.total_stock, 0)::int as stock,
      p.is_active as "isActive",
      p.is_internal as "isInternal",
      p.bundle_units as "bundleUnits",
      p.created_at as "createdAt",
      p.updated_at as "updatedAt"
    from checkout_products p
    left join (
      select cps.product_id, sum(cps.stock) as total_stock
      from checkout_product_stock cps
      join checkout_warehouses w on w.id = cps.warehouse_id
      where w.is_active = true
      group by cps.product_id
    ) s on s.product_id = p.id
  `;

  async listActive(): Promise<Product[]> {
    const rows = await this.queryRows<ProductRow>(
      `
        ${SQLProductsRepository.BASE_SELECT}
        where p.is_active = true and p.is_internal = false
        order by p.price asc
      `,
      [],
    );

    return rows.map((row) => this.mapRowToProduct(row));
  }

  async listAll(): Promise<Product[]> {
    const rows = await this.queryRows<ProductRow>(
      `
        ${SQLProductsRepository.BASE_SELECT}
        order by p.is_internal asc, p.price asc
      `,
      [],
    );

    return rows.map((row) => this.mapRowToProduct(row));
  }

  async getBySlug(slug: string): Promise<Product | null> {
    const rows = await this.queryRows<ProductRow>(
      `${SQLProductsRepository.BASE_SELECT} where p.slug = $1`,
      [slug],
    );

    return rows[0] ? this.mapRowToProduct(rows[0]) : null;
  }

  async getBySku(sku: string): Promise<Product | null> {
    const rows = await this.queryRows<ProductRow>(
      `${SQLProductsRepository.BASE_SELECT} where p.sku = $1`,
      [sku],
    );

    return rows[0] ? this.mapRowToProduct(rows[0]) : null;
  }

  async getById(id: string): Promise<Product | null> {
    const rows = await this.queryRows<ProductRow>(
      `${SQLProductsRepository.BASE_SELECT} where p.id = $1`,
      [id],
    );

    return rows[0] ? this.mapRowToProduct(rows[0]) : null;
  }

  async updatePrice(productId: string, price: number): Promise<Product | null> {
    const rows = await this.queryRows<{ id: string }>(
      `update checkout_products set price = $2, updated_at = now() where id = $1 returning id`,
      [productId, price],
    );

    return rows[0] ? this.getById(rows[0].id) : null;
  }

  private mapRowToProduct(row: ProductRow): Product {
    return {
      id: row.id,
      slug: row.slug,
      sku: row.sku,
      name: row.name,
      price: Number(row.price),
      currency: row.currency,
      stock: row.stock,
      isActive: row.isActive,
      isInternal: row.isInternal,
      bundleUnits: row.bundleUnits,
      createdAt: this.toDate(row.createdAt),
      updatedAt: this.toDate(row.updatedAt),
    };
  }

  private toDate(value: unknown): Date {
    const date = value instanceof Date ? value : new Date(String(value));

    if (Number.isNaN(date.getTime())) {
      throw new Error("Invalid product date");
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
