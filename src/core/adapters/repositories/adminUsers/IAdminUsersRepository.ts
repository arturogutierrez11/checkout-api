import { AdminUser } from "../../../entities/adminUsers/AdminUser";

export const ADMIN_USERS_REPOSITORY = Symbol("ADMIN_USERS_REPOSITORY");

export interface IAdminUsersRepository {
  listAll(): Promise<AdminUser[]>;
  getById(id: string): Promise<AdminUser | null>;
}
