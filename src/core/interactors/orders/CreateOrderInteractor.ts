import { IOrderEventsRepository } from "../../adapters/repositories/orderEvents/IOrderEventsRepository";
import { IOrdersRepository } from "../../adapters/repositories/orders/IOrdersRepository";
import { IProductStockRepository } from "../../adapters/repositories/productStock/IProductStockRepository";
import { IProductsRepository } from "../../adapters/repositories/products/IProductsRepository";
import { IMercadoPagoGateway } from "../../adapters/services/mercadoPago/IMercadoPagoGateway";
import { ShippingMethod } from "../../entities/orders/Order";
import { SHIPPING_PRICES } from "../../entities/orders/shippingPrices";
import { CARDS_SKU, PACKAGING_SKU } from "../../entities/products/Product";
import { InsufficientStockError } from "./InsufficientStockError";
import { PaymentPreferenceCreationError } from "./PaymentPreferenceCreationError";
import { ProductNotFoundError } from "./ProductNotFoundError";

export interface CreateOrderInput {
  productSlug: string;
  quantity: number;
  shippingMethod: ShippingMethod;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    address: string;
    city: string;
    province: string;
    postalCode: string;
  };
  billing: {
    dni: string;
    useShippingAddress: boolean;
    address: string | null;
    city: string | null;
    province: string | null;
    postalCode: string | null;
    isBusinessPurchase: boolean;
    cuit: string | null;
    businessName: string | null;
  };
}

export interface CreateOrderResult {
  orderId: string;
  initPoint: string;
}

/**
 * Stock is no longer reserved here — with multiple warehouses, which
 * physical location fulfils an order isn't decided until the admin picks
 * one and generates its shipping label. This only checks that the combined
 * stock across every warehouse can, in principle, cover the order; the real
 * atomic per-warehouse decrement happens in GenerateShippingLabelInteractor.
 */
export class CreateOrderInteractor {
  constructor(
    private readonly productsRepository: IProductsRepository,
    private readonly productStockRepository: IProductStockRepository,
    private readonly ordersRepository: IOrdersRepository,
    private readonly orderEventsRepository: IOrderEventsRepository,
    private readonly mercadoPagoGateway: IMercadoPagoGateway,
  ) {}

  async execute(input: CreateOrderInput): Promise<CreateOrderResult> {
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

    // Every commercial SKU (tag-one/two/ten) is a bundle of the same physical
    // card; each card ships with one packaging unit, so both pools move by
    // the same amount.
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

    const subtotal = product.price * input.quantity;
    const shippingPrice = SHIPPING_PRICES[input.shippingMethod];

    const order = await this.ordersRepository.create({
      productId: product.id,
      productSku: product.sku,
      productName: product.name,
      unitPrice: product.price,
      quantity: input.quantity,
      currency: product.currency,
      subtotal,
      shippingMethod: input.shippingMethod,
      shippingPrice,
      total: subtotal + shippingPrice,
      customerFirstName: input.customer.firstName,
      customerLastName: input.customer.lastName,
      customerEmail: input.customer.email,
      customerPhone: input.customer.phone,
      shippingAddress: input.shippingAddress.address,
      shippingCity: input.shippingAddress.city,
      shippingProvince: input.shippingAddress.province,
      shippingPostalCode: input.shippingAddress.postalCode,
      billingDni: input.billing.dni,
      billingUseShippingAddress: input.billing.useShippingAddress,
      billingAddress: input.billing.address,
      billingCity: input.billing.city,
      billingProvince: input.billing.province,
      billingPostalCode: input.billing.postalCode,
      isBusinessPurchase: input.billing.isBusinessPurchase,
      billingCuit: input.billing.cuit,
      billingBusinessName: input.billing.businessName,
    });
    const orderId = order.id;

    try {
      const preference = await this.mercadoPagoGateway.createPreference(order);
      await this.ordersRepository.setMpPreference(
        orderId,
        preference.id,
        preference.initPoint,
      );
      await this.orderEventsRepository.append({
        orderId,
        eventType: "mp_preference_created",
        payload: { preferenceId: preference.id },
      });

      return { orderId, initPoint: preference.initPoint };
    } catch (err) {
      await Promise.allSettled([
        this.ordersRepository.markPaymentInitFailed(orderId),
        this.orderEventsRepository.append({
          orderId,
          eventType: "mp_preference_creation_failed",
          payload: {
            message: err instanceof Error ? err.message : String(err),
          },
        }),
      ]);
      throw new PaymentPreferenceCreationError(orderId, err);
    }
  }
}
