import { Global, Module } from "@nestjs/common";
import { MERCADO_PAGO_GATEWAY } from "../../../core/adapters/services/mercadoPago/IMercadoPagoGateway";
import { META_CONVERSIONS_GATEWAY } from "../../../core/adapters/services/metaConversions/IMetaConversionsGateway";
import { ORDER_EMAIL_SENDER } from "../../../core/adapters/services/orderEmail/IOrderEmailSender";
import { MercadoPagoGateway } from "../../services/mercadoPago/MercadoPagoGateway";
import { MetaConversionsGateway } from "../../services/metaConversions/MetaConversionsGateway";
import { ResendOrderEmailSender } from "../../services/orderEmail/ResendOrderEmailSender";

@Global()
@Module({
  providers: [
    { provide: MERCADO_PAGO_GATEWAY, useClass: MercadoPagoGateway },
    { provide: META_CONVERSIONS_GATEWAY, useClass: MetaConversionsGateway },
    { provide: ORDER_EMAIL_SENDER, useClass: ResendOrderEmailSender },
  ],
  exports: [MERCADO_PAGO_GATEWAY, META_CONVERSIONS_GATEWAY, ORDER_EMAIL_SENDER],
})
export class ExternalServicesModule {}
