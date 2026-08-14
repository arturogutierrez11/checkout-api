import { IOrdersRepository } from "../../adapters/repositories/orders/IOrdersRepository";
import { IMercadoPagoGateway } from "../../adapters/services/mercadoPago/IMercadoPagoGateway";
import { Order } from "../../entities/orders/Order";
import { ApplyMercadoPagoPaymentToOrderInteractor } from "./ApplyMercadoPagoPaymentToOrderInteractor";
import { OrderNotFoundError } from "./OrderNotFoundError";

export class ResyncOrderInteractor {
  constructor(
    private readonly ordersRepository: IOrdersRepository,
    private readonly mercadoPagoGateway: IMercadoPagoGateway,
    private readonly applyMercadoPagoPaymentToOrderInteractor: ApplyMercadoPagoPaymentToOrderInteractor,
  ) {}

  async execute(orderId: string): Promise<Order> {
    const order = await this.ordersRepository.getById(orderId);

    if (!order) {
      throw new OrderNotFoundError(orderId);
    }

    const payments =
      await this.mercadoPagoGateway.searchPaymentsByExternalReference(orderId);
    const latestPayment = payments[0];

    if (!latestPayment) {
      return order;
    }

    await this.applyMercadoPagoPaymentToOrderInteractor.execute(
      order,
      latestPayment,
    );

    const updated = await this.ordersRepository.getById(orderId);
    return updated ?? order;
  }
}
