import { IOrdersRepository } from "../../adapters/repositories/orders/IOrdersRepository";
import { IMercadoPagoGateway } from "../../adapters/services/mercadoPago/IMercadoPagoGateway";
import { ApplyMercadoPagoPaymentToOrderInteractor } from "../orders/ApplyMercadoPagoPaymentToOrderInteractor";
import { InvalidWebhookSignatureError } from "./InvalidWebhookSignatureError";

export interface ProcessWebhookInput {
  type: string | undefined;
  paymentId: string | undefined;
  xSignature: string | null;
  xRequestId: string | null;
}

export class ProcessMercadoPagoWebhookInteractor {
  constructor(
    private readonly mercadoPagoGateway: IMercadoPagoGateway,
    private readonly ordersRepository: IOrdersRepository,
    private readonly applyMercadoPagoPaymentToOrderInteractor: ApplyMercadoPagoPaymentToOrderInteractor,
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

    await this.applyMercadoPagoPaymentToOrderInteractor.execute(order, payment);
  }
}
