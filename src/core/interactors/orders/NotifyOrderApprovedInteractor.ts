import { IOrderEventsRepository } from "../../adapters/repositories/orderEvents/IOrderEventsRepository";
import { IOrdersRepository } from "../../adapters/repositories/orders/IOrdersRepository";
import { IMetaConversionsGateway } from "../../adapters/services/metaConversions/IMetaConversionsGateway";
import { IOrderEmailSender } from "../../adapters/services/orderEmail/IOrderEmailSender";

/**
 * Side effects of an order becoming 'approved', regardless of how the money
 * arrived (Mercado Pago webhook, manual resync, or an admin confirming a bank
 * transfer): the confirmation email and the Meta Purchase conversion event.
 * Each is guarded by its own atomic flag so it fires at most once, and a
 * failure in one never blocks the other (the flag is cleared so a later
 * retry can still send it).
 */
export class NotifyOrderApprovedInteractor {
  constructor(
    private readonly ordersRepository: IOrdersRepository,
    private readonly orderEventsRepository: IOrderEventsRepository,
    private readonly orderEmailSender: IOrderEmailSender,
    private readonly metaConversionsGateway: IMetaConversionsGateway,
  ) {}

  async execute(orderId: string): Promise<void> {
    const shouldSendEmail = await this.ordersRepository.markEmailSent(orderId);
    const shouldSendMetaPurchase =
      await this.ordersRepository.markMetaPurchaseSent(orderId);

    if (!shouldSendEmail && !shouldSendMetaPurchase) {
      return;
    }

    const updatedOrder = await this.ordersRepository.getById(orderId);

    if (!updatedOrder) {
      return;
    }

    if (shouldSendEmail) {
      try {
        await this.orderEmailSender.sendOrderConfirmation(updatedOrder);
      } catch (err) {
        await this.orderEventsRepository.append({
          orderId,
          eventType: "email_failed",
          payload: {
            message: err instanceof Error ? err.message : String(err),
          },
        });
        await this.ordersRepository.clearEmailSent(orderId);
      }
    }

    if (shouldSendMetaPurchase) {
      try {
        await this.metaConversionsGateway.sendPurchaseEvent(updatedOrder);
      } catch (err) {
        await this.orderEventsRepository.append({
          orderId,
          eventType: "meta_purchase_failed",
          payload: {
            message: err instanceof Error ? err.message : String(err),
          },
        });
        await this.ordersRepository.clearMetaPurchaseSent(orderId);
      }
    }
  }
}
