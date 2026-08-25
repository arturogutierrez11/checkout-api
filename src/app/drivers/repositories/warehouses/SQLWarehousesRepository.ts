import { Injectable } from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import { EntityManager } from "typeorm";
import { IWarehousesRepository } from "../../../../core/adapters/repositories/warehouses/IWarehousesRepository";
import {
  CreateWarehouseData,
  Warehouse,
} from "../../../../core/entities/warehouses/Warehouse";

interface WarehouseRow {
  id: string;
  slug: string;
  name: string;
  addressStreet: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressZipcode: string | null;
  addressPhone: string | null;
  addressEmail: string | null;
  zipnovaOriginId: number;
  priority: number;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

const SELECT_COLUMNS = `
  id,
  slug,
  name,
  address_street as "addressStreet",
  address_city as "addressCity",
  address_state as "addressState",
  address_zipcode as "addressZipcode",
  address_phone as "addressPhone",
  address_email as "addressEmail",
  zipnova_origin_id as "zipnovaOriginId",
  priority,
  is_active as "isActive",
  created_at as "createdAt",
  updated_at as "updatedAt"
`;

@Injectable()
export class SQLWarehousesRepository implements IWarehousesRepository {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async listActive(): Promise<Warehouse[]> {
    const rows = await this.queryRows<WarehouseRow>(
      `
        select ${SELECT_COLUMNS}
        from checkout_warehouses
        where is_active = true
        order by priority asc, created_at asc
      `,
      [],
    );

    return rows.map((row) => this.mapRowToWarehouse(row));
  }

  async getById(id: string): Promise<Warehouse | null> {
    const rows = await this.queryRows<WarehouseRow>(
      `select ${SELECT_COLUMNS} from checkout_warehouses where id = $1`,
      [id],
    );

    return rows[0] ? this.mapRowToWarehouse(rows[0]) : null;
  }

  async getBySlug(slug: string): Promise<Warehouse | null> {
    const rows = await this.queryRows<WarehouseRow>(
      `select ${SELECT_COLUMNS} from checkout_warehouses where slug = $1`,
      [slug],
    );

    return rows[0] ? this.mapRowToWarehouse(rows[0]) : null;
  }

  async create(data: CreateWarehouseData): Promise<Warehouse> {
    const rows = await this.queryRows<WarehouseRow>(
      `
        insert into checkout_warehouses
          (slug, name, address_street, address_city, address_state,
           address_zipcode, address_phone, address_email, zipnova_origin_id,
           priority)
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        returning ${SELECT_COLUMNS}
      `,
      [
        data.slug,
        data.name,
        data.addressStreet ?? null,
        data.addressCity ?? null,
        data.addressState ?? null,
        data.addressZipcode ?? null,
        data.addressPhone ?? null,
        data.addressEmail ?? null,
        data.zipnovaOriginId,
        data.priority ?? 0,
      ],
    );

    return this.mapRowToWarehouse(rows[0]);
  }

  private mapRowToWarehouse(row: WarehouseRow): Warehouse {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      addressStreet: row.addressStreet,
      addressCity: row.addressCity,
      addressState: row.addressState,
      addressZipcode: row.addressZipcode,
      addressPhone: row.addressPhone,
      addressEmail: row.addressEmail,
      zipnovaOriginId: row.zipnovaOriginId,
      priority: row.priority,
      isActive: row.isActive,
      createdAt: this.toDate(row.createdAt),
      updatedAt: this.toDate(row.updatedAt),
    };
  }

  private toDate(value: unknown): Date {
    const date = value instanceof Date ? value : new Date(String(value));

    if (Number.isNaN(date.getTime())) {
      throw new Error("Invalid warehouse date");
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
