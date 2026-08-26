import { Injectable } from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import { EntityManager } from "typeorm";
import { IAdminUsersRepository } from "../../../../core/adapters/repositories/adminUsers/IAdminUsersRepository";
import { AdminUser } from "../../../../core/entities/adminUsers/AdminUser";

const SELECT_COLUMNS = `
  u.id,
  u.email,
  u.display_name as "displayName"
`;

/**
 * `admin_users`/`users` are shared tables owned by auth.api, not
 * checkout_*-prefixed — read directly via the shared Neon connection, same
 * pattern core.api already uses for cross-service reads of `users`.
 */
@Injectable()
export class SQLAdminUsersRepository implements IAdminUsersRepository {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async listAll(): Promise<AdminUser[]> {
    const rows = await this.queryRows<AdminUser>(
      `
        select ${SELECT_COLUMNS}
        from admin_users a
        join users u on u.id = a.user_id
        order by u.email asc
      `,
      [],
    );

    return rows;
  }

  async getById(id: string): Promise<AdminUser | null> {
    const rows = await this.queryRows<AdminUser>(
      `
        select ${SELECT_COLUMNS}
        from admin_users a
        join users u on u.id = a.user_id
        where u.id = $1
      `,
      [id],
    );

    return rows[0] ?? null;
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
