import { IOrderEventsRepository } from "../../adapters/repositories/orderEvents/IOrderEventsRepository";
import { IOrdersRepository } from "../../adapters/repositories/orders/IOrdersRepository";
import { IProductsRepository } from "../../adapters/repositories/products/IProductsRepository";
import { IFullargGateway } from "../../adapters/services/fullarg/IFullargGateway";
import { Order } from "../../entities/orders/Order";
import { OrderNotFoundError } from "./OrderNotFoundError";
import { OrderNotShippableError } from "./OrderNotShippableError";
import { ProductNotFoundError } from "./ProductNotFoundError";

/** Dirección en una sola línea: Fullarg solo recibe `address`, sin campos de piso/depto. */
function buildAddressLine(order: Order): string {
  return [
    order.shippingAddress.trim(),
    order.shippingFloor ? `Piso ${order.shippingFloor}` : null,
    order.shippingApartment ? `Depto ${order.shippingApartment}` : null,
  ]
    .filter(Boolean)
    .join(", ");
}

/**
 * Manda la orden a Fullarg (3PL que empaqueta y despacha). Solo viajan los
 * datos del destinatario y el destino más el SKU de la tarjeta; el stock lo
 * maneja Fullarg, por eso acá no se descuenta de nuestros depósitos.
 *
 * Idempotente: usamos el id de la orden como clave, así un doble click o un
 * reintento después de un timeout no crea dos envíos.
 */
export class SendOrderToFullargInteractor {
  constructor(
    private readonly ordersRepository: IOrdersRepository,
    private readonly productsRepository: IProductsRepository,
    private readonly fullargGateway: IFullargGateway,
    private readonly orderEventsRepository: IOrderEventsRepository,
    private readonly fullargSku: string | undefined,
  ) {}

  async execute(orderId: string): Promise<Order> {
    const order = await this.ordersRepository.getById(orderId);

    if (!order) {
      throw new OrderNotFoundError(orderId);
    }

    if (order.status !== "approved") {
      throw new OrderNotShippableError(orderId);
    }

    if (order.fullargSalesOrder) {
      return order;
    }

    if (!this.fullargSku) {
      throw new Error("Fullarg no está configurado (falta FULLARG_SKU).");
    }

    const product = await this.productsRepository.getById(order.productId);

    if (!product) {
      throw new ProductNotFoundError(order.productSku);
    }

    // Cada SKU comercial (tag-one/two/ten) es un pack de la misma tarjeta
    // física; en Fullarg hay un solo SKU, así que mandamos tarjetas sueltas.
    const cardUnits = order.quantity * product.bundleUnits;

    const created = await this.fullargGateway.createOrder({
      externalOrderId: order.id,
      idempotencyKey: `rituo-${order.id}`,
      sku: this.fullargSku,
      quantity: cardUnits,
      buyer: {
        name: `${order.customerFirstName} ${order.customerLastName}`.trim(),
        email: order.customerEmail,
        phone: order.customerPhone,
      },
      shipping: {
        address: buildAddressLine(order),
        city: order.shippingCity,
        state: order.shippingProvince,
        postalCode: order.shippingPostalCode,
      },
    });

    await this.ordersRepository.saveFullargOrder(orderId, {
      salesOrder: created.salesOrder,
      status: created.status,
    });

    await this.orderEventsRepository.append({
      orderId,
      eventType: "fullarg_order_created",
      payload: {
        provider: "fullarg",
        salesOrder: created.salesOrder,
        status: created.status,
        alreadyExisted: created.alreadyExisted,
        cardUnits,
      },
    });

    const updated = await this.ordersRepository.getById(orderId);
    return updated ?? order;
  }
}
