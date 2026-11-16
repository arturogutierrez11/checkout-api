import { IOrderEventsRepository } from "../../adapters/repositories/orderEvents/IOrderEventsRepository";
import { IOrdersRepository } from "../../adapters/repositories/orders/IOrdersRepository";
import { IOrderEmailSender } from "../../adapters/services/orderEmail/IOrderEmailSender";
import { Order } from "../../entities/orders/Order";
import { OrderNotFoundError } from "./OrderNotFoundError";
import { OrderTrackingMissingError } from "./OrderTrackingMissingError";

/**
 * Reenvía a mano el mail "Tu pedido está en camino" con el seguimiento. Sirve si
 * el envío automático falló o si el comprador no lo recibió. A diferencia del
 * automático, no mira si ya se había mandado: el admin lo pide a propósito.
 */
export class ResendShippedEmailInteractor {
  constructor(
    private readonly ordersRepository: IOrdersRepository,
    private readonly orderEventsRepository: IOrderEventsRepository,
    private readonly orderEmailSender: IOrderEmailSender,
  ) {}

  async execute(orderId: string): Promise<Order> {
    const order = await this.ordersRepository.getById(orderId);

    if (!order) {
      throw new OrderNotFoundError(orderId);
    }

    if (!order.shippingTrackingNumber) {
      throw new OrderTrackingMissingError(orderId);
    }

    try {
      await this.orderEmailSender.sendOrderShipped(order);
    } catch (err) {
      await this.orderEventsRepository.append({
        orderId,
        eventType: "shipped_email_failed",
        payload: {
          manual: true,
          message: err instanceof Error ? err.message : String(err),
        },
      });
      throw err;
    }

    await this.ordersRepository.markShippedEmailSent(orderId);
    await this.orderEventsRepository.append({
      orderId,
      eventType: "shipped_email_sent",
      payload: {
        manual: true,
        carrier: order.shippingCarrier,
        trackingNumber: order.shippingTrackingNumber,
      },
    });

    return (await this.ordersRepository.getById(orderId)) ?? order;
  }
}
