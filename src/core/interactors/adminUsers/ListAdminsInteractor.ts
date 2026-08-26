import { IAdminUsersRepository } from "../../adapters/repositories/adminUsers/IAdminUsersRepository";
import { AdminUser } from "../../entities/adminUsers/AdminUser";

export class ListAdminsInteractor {
  constructor(private readonly adminUsersRepository: IAdminUsersRepository) {}

  execute(): Promise<AdminUser[]> {
    return this.adminUsersRepository.listAll();
  }
}
