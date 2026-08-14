import { IOrderEventsRepository } from "../../adapters/repositories/orderEvents/IOrderEventsRepository";
import { IOrdersRepository } from "../../adapters/repositories/orders/IOrdersRepository";
import { MercadoPagoPayment } from "../../adapters/services/mercadoPago/IMercadoPagoGateway";
import { IOrderEmailSender } from "../../adapters/services/orderEmail/IOrderEmailSender";
import { Order } from "../../entities/orders/Order";
import { ReleaseOrderStockInteractor } from "../inventory/ReleaseOrderStockInteractor";

function mapMpStatusToOrderStatus(
  mpStatus: string,
): "approved" | "rejected" | "cancelled" | null {
  if (mpStatus === "approved") return "approved";
  if (mpStatus === "rejected") return "rejected";
  if (mpStatus === "cancelled") return "cancelled";
  return null;
}

/**
 * Reconciles a real Mercado Pago payment against an order: records the raw
 * event, flips pending -> approved/rejected/cancelled at most once, and
 * fires the confirmation email exactly once on approval. Shared by the
 * webhook handler and the manual "resync" admin action so both paths stay
 * consistent and idempotent.
 */
export class ApplyMercadoPagoPaymentToOrderInteractor {
  constructor(
    private readonly ordersRepository: IOrdersRepository,
    private readonly orderEventsRepository: IOrderEventsRepository,
    private readonly orderEmailSender: IOrderEmailSender,
    private readonly releaseOrderStockInteractor: ReleaseOrderStockInteractor,
  ) {}

  async execute(order: Order, payment: MercadoPagoPayment): Promise<void> {
    await this.orderEventsRepository.append({
      orderId: order.id,
      eventType: "webhook_received",
      payload: {
        paymentId: payment.id,
        status: payment.status,
        statusDetail: payment.statusDetail,
      },
    });

    const nextStatus = mapMpStatusToOrderStatus(payment.status);
    const mpFields = {
      mpPaymentId: String(payment.id),
      mpPaymentStatus: payment.status,
      mpPaymentStatusDetail: payment.statusDetail,
    };

    if (nextStatus) {
      const transitioned =
        await this.ordersRepository.transitionStatusFromPending(
          order.id,
          nextStatus,
          mpFields,
        );

      if (transitioned) {
        await this.orderEventsRepository.append({
          orderId: order.id,
          eventType: "status_transitioned",
          payload: { from: "pending", to: nextStatus, paymentId: payment.id },
        });

        if (nextStatus === "rejected" || nextStatus === "cancelled") {
          await this.releaseOrderStockInteractor.execute({
            orderId: order.id,
            productId: order.productId,
            quantity: order.quantity,
            movementType: "cancellation",
            note: `mp_status_${payment.status}`,
          });
        }
      }
    } else {
      await this.ordersRepository.updateMpPaymentInfo(order.id, mpFields);
    }

    if (nextStatus === "approved") {
      const shouldSend = await this.ordersRepository.markEmailSent(order.id);

      if (shouldSend) {
        try {
          const updatedOrder = await this.ordersRepository.getById(order.id);
          if (updatedOrder) {
            await this.orderEmailSender.sendOrderConfirmation(updatedOrder);
          }
        } catch (err) {
          await this.orderEventsRepository.append({
            orderId: order.id,
            eventType: "email_failed",
            payload: {
              message: err instanceof Error ? err.message : String(err),
            },
          });
          await this.ordersRepository.clearEmailSent(order.id);
        }
      }
    }
  }
}
