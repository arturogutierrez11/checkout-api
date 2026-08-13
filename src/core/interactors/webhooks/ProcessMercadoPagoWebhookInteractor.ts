import { IOrderEventsRepository } from "../../adapters/repositories/orderEvents/IOrderEventsRepository";
import { IOrdersRepository } from "../../adapters/repositories/orders/IOrdersRepository";
import { IMercadoPagoGateway } from "../../adapters/services/mercadoPago/IMercadoPagoGateway";
import { IOrderEmailSender } from "../../adapters/services/orderEmail/IOrderEmailSender";
import { InvalidWebhookSignatureError } from "./InvalidWebhookSignatureError";

export interface ProcessWebhookInput {
  type: string | undefined;
  paymentId: string | undefined;
  xSignature: string | null;
  xRequestId: string | null;
}

function mapMpStatusToOrderStatus(
  mpStatus: string,
): "approved" | "rejected" | "cancelled" | null {
  if (mpStatus === "approved") return "approved";
  if (mpStatus === "rejected") return "rejected";
  if (mpStatus === "cancelled") return "cancelled";
  return null;
}

export class ProcessMercadoPagoWebhookInteractor {
  constructor(
    private readonly mercadoPagoGateway: IMercadoPagoGateway,
    private readonly ordersRepository: IOrdersRepository,
    private readonly orderEventsRepository: IOrderEventsRepository,
    private readonly orderEmailSender: IOrderEmailSender,
  ) {}

  async execute(input: ProcessWebhookInput): Promise<void> {
    if (input.type !== "payment" || !input.paymentId) {
      return;
    }

    if (
      !this.mercadoPagoGateway.verifyWebhookSignature({
        xSignature: input.xSignature,
        xRequestId: input.xRequestId,
        dataId: input.paymentId,
      })
    ) {
      throw new InvalidWebhookSignatureError();
    }

    const payment = await this.mercadoPagoGateway.getPayment(input.paymentId);
    const order = payment.externalReference
      ? await this.ordersRepository.getById(payment.externalReference)
      : null;

    if (!order) {
      return;
    }

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
