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
  createdAt: Date | string;
  updatedAt: Date | string;
}

@Injectable()
export class SQLProductsRepository implements IProductsRepository {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async listActive(): Promise<Product[]> {
    const rows = await this.queryRows<ProductRow>(
      `
        select
          id,
          slug,
          sku,
          name,
          price,
          currency,
          stock,
          is_active as "isActive",
          created_at as "createdAt",
          updated_at as "updatedAt"
        from checkout_products
        where is_active = true
        order by price asc
      `,
      [],
    );

    return rows.map((row) => this.mapRowToProduct(row));
  }

  async getBySlug(slug: string): Promise<Product | null> {
    const rows = await this.queryRows<ProductRow>(
      `
        select
          id, slug, sku, name, price, currency, stock,
          is_active as "isActive",
          created_at as "createdAt",
          updated_at as "updatedAt"
        from checkout_products
        where slug = $1
      `,
      [slug],
    );

    return rows[0] ? this.mapRowToProduct(rows[0]) : null;
  }

  async getById(id: string): Promise<Product | null> {
    const rows = await this.queryRows<ProductRow>(
      `
        select
          id, slug, sku, name, price, currency, stock,
          is_active as "isActive",
          created_at as "createdAt",
          updated_at as "updatedAt"
        from checkout_products
        where id = $1
      `,
      [id],
    );

    return rows[0] ? this.mapRowToProduct(rows[0]) : null;
  }

  async decrementStock(productId: string, quantity: number): Promise<boolean> {
    const rows = await this.queryRows<{ id: string }>(
      `
        update checkout_products
        set stock = stock - $2, updated_at = now()
        where id = $1 and stock >= $2
        returning id
      `,
      [productId, quantity],
    );

    return rows.length > 0;
  }

  async incrementStock(productId: string, quantity: number): Promise<void> {
    await this.entityManager.query(
      `
        update checkout_products
        set stock = stock + $2, updated_at = now()
        where id = $1
      `,
      [productId, quantity],
    );
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
