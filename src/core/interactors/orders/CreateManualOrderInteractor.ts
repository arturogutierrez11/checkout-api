import { IOrderEventsRepository } from "../../adapters/repositories/orderEvents/IOrderEventsRepository";
import { IOrdersRepository } from "../../adapters/repositories/orders/IOrdersRepository";
import { IProductStockRepository } from "../../adapters/repositories/productStock/IProductStockRepository";
import { IProductsRepository } from "../../adapters/repositories/products/IProductsRepository";
import { IOrderEmailSender } from "../../adapters/services/orderEmail/IOrderEmailSender";
import { Order, ShippingMethod } from "../../entities/orders/Order";
import { SHIPPING_PRICES } from "../../entities/orders/shippingPrices";
import { CARDS_SKU, PACKAGING_SKU } from "../../entities/products/Product";
import { InsufficientStockError } from "./InsufficientStockError";
import { ProductNotFoundError } from "./ProductNotFoundError";

export interface CreateManualOrderInput {
  productSlug: string;
  quantity: number;
  shippingMethod: ShippingMethod;
  /** Every field here is optional — a manual sale can be entered with incomplete data. */
  customer: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  shippingAddress: {
    address?: string;
    city?: string;
    province?: string;
    postalCode?: string;
  };
  billing: {
    dni?: string;
    useShippingAddress?: boolean;
    address?: string | null;
    city?: string | null;
    province?: string | null;
    postalCode?: string | null;
    isBusinessPurchase?: boolean;
    cuit?: string | null;
    businessName?: string | null;
  };
  manualPaymentMethod: string;
  manualPaymentNote: string | null;
  /** Overrides the catalog price per unit — e.g. a discount given by hand. */
  unitPriceOverride?: number;
}

/**
 * A sale the admin registers by hand (cash, bank transfer, in person) —
 * payment already happened outside the system, so the order is inserted
 * straight to 'approved' and the confirmation email fires immediately,
 * instead of going through Mercado Pago's pending -> webhook flow. Stock
 * still isn't reserved here (same as CreateOrderInteractor) — only a soft
 * cross-warehouse availability check; the real reservation happens when a
 * shipping label gets generated.
 */
export class CreateManualOrderInteractor {
  constructor(
    private readonly productsRepository: IProductsRepository,
    private readonly productStockRepository: IProductStockRepository,
    private readonly ordersRepository: IOrdersRepository,
    private readonly orderEventsRepository: IOrderEventsRepository,
    private readonly orderEmailSender: IOrderEmailSender,
  ) {}

  async execute(input: CreateManualOrderInput): Promise<Order> {
    const product = await this.productsRepository.getBySlug(input.productSlug);

    if (!product || !product.isActive) {
      throw new ProductNotFoundError(input.productSlug);
    }

    const cardsProduct = await this.productsRepository.getBySku(CARDS_SKU);

    if (!cardsProduct) {
      throw new Error(`Cards product ${CARDS_SKU} not found`);
    }

    const packaging = await this.productsRepository.getBySku(PACKAGING_SKU);

    if (!packaging) {
      throw new Error(`Packaging product ${PACKAGING_SKU} not found`);
    }

    const cardUnits = input.quantity * product.bundleUnits;

    const [totalCards, totalPackaging] = await Promise.all([
      this.productStockRepository.getTotalStock(cardsProduct.id),
      this.productStockRepository.getTotalStock(packaging.id),
    ]);

    if (totalCards < cardUnits) {
      throw new InsufficientStockError(cardsProduct.id);
    }

    if (totalPackaging < cardUnits) {
      throw new InsufficientStockError(packaging.id);
    }

    const unitPrice = input.unitPriceOverride ?? product.price;
    const subtotal = unitPrice * input.quantity;
    const shippingPrice = SHIPPING_PRICES[input.shippingMethod];
    const customerEmail = input.customer.email?.trim() ?? "";

    const order = await this.ordersRepository.createManual({
      productId: product.id,
      productSku: product.sku,
      productName: product.name,
      unitPrice,
      quantity: input.quantity,
      currency: product.currency,
      subtotal,
      shippingMethod: input.shippingMethod,
      shippingPrice,
      total: subtotal + shippingPrice,
      customerFirstName: input.customer.firstName ?? "",
      customerLastName: input.customer.lastName ?? "",
      customerEmail,
      customerPhone: input.customer.phone ?? "",
      shippingAddress: input.shippingAddress.address ?? "",
      shippingCity: input.shippingAddress.city ?? "",
      shippingProvince: input.shippingAddress.province ?? "",
      shippingPostalCode: input.shippingAddress.postalCode ?? "",
      billingDni: input.billing.dni ?? "",
      billingUseShippingAddress: input.billing.useShippingAddress ?? true,
      billingAddress: input.billing.address ?? null,
      billingCity: input.billing.city ?? null,
      billingProvince: input.billing.province ?? null,
      billingPostalCode: input.billing.postalCode ?? null,
      isBusinessPurchase: input.billing.isBusinessPurchase ?? false,
      billingCuit: input.billing.cuit ?? null,
      billingBusinessName: input.billing.businessName ?? null,
      manualPaymentMethod: input.manualPaymentMethod,
      manualPaymentNote: input.manualPaymentNote,
    });

    await this.orderEventsRepository.append({
      orderId: order.id,
      eventType: "manual_sale_created",
      payload: { manualPaymentMethod: input.manualPaymentMethod },
    });

    // No email on file — nothing to send, and nothing to mark either (if it
    // gets filled in later there's still a chance to send it manually).
    if (!customerEmail) {
      return order;
    }

    const shouldSend = await this.ordersRepository.markEmailSent(order.id);

    if (shouldSend) {
      try {
        await this.orderEmailSender.sendOrderConfirmation(order);
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

    return order;
  }
}
