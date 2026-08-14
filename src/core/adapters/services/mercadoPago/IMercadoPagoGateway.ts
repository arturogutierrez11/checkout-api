import { Order } from "../../../entities/orders/Order";

export const MERCADO_PAGO_GATEWAY = Symbol("MERCADO_PAGO_GATEWAY");

export interface MercadoPagoPreference {
  id: string;
  initPoint: string;
}

export interface MercadoPagoPayment {
  id: number;
  status: string;
  statusDetail: string;
  externalReference: string | null;
  transactionAmount: number;
}

export interface VerifyWebhookSignatureInput {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string;
}

export interface IMercadoPagoGateway {
  createPreference(order: Order): Promise<MercadoPagoPreference>;
  getPayment(paymentId: string): Promise<MercadoPagoPayment>;
  /** Últimos pagos asociados a una orden, sin necesidad de conocer su payment id (ordenados del más reciente al más viejo). */
  searchPaymentsByExternalReference(
    externalReference: string,
  ): Promise<MercadoPagoPayment[]>;
  verifyWebhookSignature(input: VerifyWebhookSignatureInput): boolean;
}
