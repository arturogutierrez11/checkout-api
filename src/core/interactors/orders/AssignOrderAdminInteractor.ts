import { IAdminUsersRepository } from "../../adapters/repositories/adminUsers/IAdminUsersRepository";
import { IOrdersRepository } from "../../adapters/repositories/orders/IOrdersRepository";
import { Order } from "../../entities/orders/Order";
import { AdminUserNotFoundError } from "./AdminUserNotFoundError";
import { OrderNotFoundError } from "./OrderNotFoundError";

export class AssignOrderAdminInteractor {
  constructor(
    private readonly ordersRepository: IOrdersRepository,
    private readonly adminUsersRepository: IAdminUsersRepository,
  ) {}

  async execute(orderId: string, adminUserId: string | null): Promise<Order> {
    if (adminUserId) {
      const admin = await this.adminUsersRepository.getById(adminUserId);

      if (!admin) {
        throw new AdminUserNotFoundError(adminUserId);
      }
    }

    const assigned = await this.ordersRepository.assignAdmin(
      orderId,
      adminUserId,
    );

    if (!assigned) {
      throw new OrderNotFoundError(orderId);
    }

    const order = await this.ordersRepository.getById(orderId);

    if (!order) {
      throw new OrderNotFoundError(orderId);
    }

    return order;
  }
}
