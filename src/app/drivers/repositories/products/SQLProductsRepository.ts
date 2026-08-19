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
          is_internal as "isInternal",
          bundle_units as "bundleUnits",
          created_at as "createdAt",
          updated_at as "updatedAt"
        from checkout_products
        where is_active = true and is_internal = false
        order by price asc
      `,
      [],
    );

    return rows.map((row) => this.mapRowToProduct(row));
  }

  async listAll(): Promise<Product[]> {
    const rows = await this.queryRows<ProductRow>(
      `
        select
          id, slug, sku, name, price, currency, stock,
          is_active as "isActive",
          is_internal as "isInternal",
          bundle_units as "bundleUnits",
          created_at as "createdAt",
          updated_at as "updatedAt"
        from checkout_products
        order by is_internal asc, price asc
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
          is_internal as "isInternal",
          bundle_units as "bundleUnits",
          created_at as "createdAt",
          updated_at as "updatedAt"
        from checkout_products
        where slug = $1
      `,
      [slug],
    );

    return rows[0] ? this.mapRowToProduct(rows[0]) : null;
  }

  async getBySku(sku: string): Promise<Product | null> {
    const rows = await this.queryRows<ProductRow>(
      `
        select
          id, slug, sku, name, price, currency, stock,
          is_active as "isActive",
          is_internal as "isInternal",
          bundle_units as "bundleUnits",
          created_at as "createdAt",
          updated_at as "updatedAt"
        from checkout_products
        where sku = $1
      `,
      [sku],
    );

    return rows[0] ? this.mapRowToProduct(rows[0]) : null;
  }

  async getById(id: string): Promise<Product | null> {
    const rows = await this.queryRows<ProductRow>(
      `
        select
          id, slug, sku, name, price, currency, stock,
          is_active as "isActive",
          is_internal as "isInternal",
          bundle_units as "bundleUnits",
          created_at as "createdAt",
          updated_at as "updatedAt"
        from checkout_products
        where id = $1
      `,
      [id],
    );

    return rows[0] ? this.mapRowToProduct(rows[0]) : null;
  }

  async decrementStock(
    productId: string,
    quantity: number,
  ): Promise<number | null> {
    const rows = await this.queryRows<{ stock: number }>(
      `
        update checkout_products
        set stock = stock - $2, updated_at = now()
        where id = $1 and stock >= $2
        returning stock
      `,
      [productId, quantity],
    );

    return rows[0] ? rows[0].stock : null;
  }

  async incrementStock(productId: string, quantity: number): Promise<number> {
    const rows = await this.queryRows<{ stock: number }>(
      `
        update checkout_products
        set stock = stock + $2, updated_at = now()
        where id = $1
        returning stock
      `,
      [productId, quantity],
    );

    if (!rows[0]) {
      throw new Error(
        `Product ${productId} not found while incrementing stock`,
      );
    }

    return rows[0].stock;
  }

  async updatePrice(productId: string, price: number): Promise<Product | null> {
    const rows = await this.queryRows<ProductRow>(
      `
        update checkout_products
        set price = $2, updated_at = now()
        where id = $1
        returning
          id, slug, sku, name, price, currency, stock,
          is_active as "isActive",
          is_internal as "isInternal",
          bundle_units as "bundleUnits",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `,
      [productId, price],
    );

    return rows[0] ? this.mapRowToProduct(rows[0]) : null;
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
