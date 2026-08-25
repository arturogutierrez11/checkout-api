import { IInventoryMovementsRepository } from "../../adapters/repositories/inventoryMovements/IInventoryMovementsRepository";
import { IOrderEventsRepository } from "../../adapters/repositories/orderEvents/IOrderEventsRepository";
import { IOrdersRepository } from "../../adapters/repositories/orders/IOrdersRepository";
import { IProductStockRepository } from "../../adapters/repositories/productStock/IProductStockRepository";
import { IProductsRepository } from "../../adapters/repositories/products/IProductsRepository";
import { IWarehousesRepository } from "../../adapters/repositories/warehouses/IWarehousesRepository";
import { IZipnovaGateway } from "../../adapters/services/zipnova/IZipnovaGateway";
import { Order } from "../../entities/orders/Order";
import { CARDS_SKU, PACKAGING_SKU } from "../../entities/products/Product";
import { Warehouse } from "../../entities/warehouses/Warehouse";
import { WarehouseNotFoundError } from "../warehouses/WarehouseNotFoundError";
import { InsufficientStockError } from "./InsufficientStockError";
import { OrderNotFoundError } from "./OrderNotFoundError";
import { OrderNotShippableError } from "./OrderNotShippableError";
import { ProductNotFoundError } from "./ProductNotFoundError";
import { ShippingQuoteUnavailableError } from "./ShippingQuoteUnavailableError";

const CORREO_ARGENTINO = "Correo Argentino";

/**
 * pickup_point service types need a destination.point_id chosen from a list
 * of nearby branches, which doesn't fit an unattended flow — and the
 * checkout already promised home delivery to the address the customer typed.
 */
const PICKUP_POINT_SERVICE_TYPE = "pickup_point";

/** Best-effort split of a free-text Argentine address into street + number. */
function splitStreetAndNumber(address: string): {
  street: string;
  streetNumber: string;
} {
  const match = /^(.*?)(\d+)\s*$/.exec(address.trim());

  if (!match) {
    return { street: address.trim(), streetNumber: "S/N" };
  }

  return { street: match[1].trim(), streetNumber: match[2] };
}

export class GenerateShippingLabelInteractor {
  constructor(
    private readonly ordersRepository: IOrdersRepository,
    private readonly productsRepository: IProductsRepository,
    private readonly productStockRepository: IProductStockRepository,
    private readonly warehousesRepository: IWarehousesRepository,
    private readonly inventoryMovementsRepository: IInventoryMovementsRepository,
    private readonly zipnovaGateway: IZipnovaGateway,
    private readonly orderEventsRepository: IOrderEventsRepository,
  ) {}

  async execute(orderId: string, warehouseId: string): Promise<Order> {
    const order = await this.ordersRepository.getById(orderId);

    if (!order) {
      throw new OrderNotFoundError(orderId);
    }

    if (order.status !== "approved") {
      throw new OrderNotShippableError(orderId);
    }

    if (order.shippingZipnovaShipmentId) {
      return order;
    }

    const selectedWarehouse =
      await this.warehousesRepository.getById(warehouseId);

    if (!selectedWarehouse || !selectedWarehouse.isActive) {
      throw new WarehouseNotFoundError(warehouseId);
    }

    const product = await this.productsRepository.getById(order.productId);

    if (!product) {
      throw new ProductNotFoundError(order.productSku);
    }

    const cardUnits = order.quantity * product.bundleUnits;

    const originWarehouse = await this.resolveOriginWarehouse(
      orderId,
      cardUnits,
      selectedWarehouse,
    );

    const quotes = await this.zipnovaGateway.quoteShipment({
      originId: originWarehouse.zipnovaOriginId,
      declaredValue: order.subtotal,
      cardUnits,
      destination: {
        city: order.shippingCity,
        state: order.shippingProvince,
        zipcode: order.shippingPostalCode,
      },
    });

    const correoOptions = quotes.filter(
      (quote) =>
        quote.carrierName === CORREO_ARGENTINO &&
        quote.serviceType !== PICKUP_POINT_SERVICE_TYPE,
    );

    if (correoOptions.length === 0) {
      throw new ShippingQuoteUnavailableError(orderId);
    }

    const cheapest = correoOptions.reduce((min, current) =>
      current.price < min.price ? current : min,
    );

    const { street, streetNumber } = splitStreetAndNumber(
      order.shippingAddress,
    );

    const created = await this.zipnovaGateway.createShipment({
      originId: originWarehouse.zipnovaOriginId,
      carrierId: cheapest.carrierId,
      serviceType: cheapest.serviceType,
      logisticType: cheapest.logisticType,
      declaredValue: order.subtotal,
      // Zipnova caps external_id at 30 chars; a UUID is 36 (32 without dashes).
      externalId: order.id.replace(/-/g, "").slice(0, 30),
      cardUnits,
      destination: {
        name: `${order.customerFirstName} ${order.customerLastName}`,
        street,
        streetNumber,
        document: order.billingDni,
        email: order.customerEmail,
        phone: order.customerPhone,
        city: order.shippingCity,
        state: order.shippingProvince,
        zipcode: order.shippingPostalCode,
      },
    });

    await this.ordersRepository.saveShipmentDetails(orderId, {
      carrier: CORREO_ARGENTINO,
      trackingNumber: created.trackingNumber,
      realCost: created.price,
      zipnovaShipmentId: String(created.id),
    });

    await this.orderEventsRepository.append({
      orderId,
      eventType: "shipping_label_generated",
      payload: {
        provider: "zipnova",
        zipnovaShipmentId: created.id,
        carrier: CORREO_ARGENTINO,
        serviceType: cheapest.serviceType,
        trackingNumber: created.trackingNumber,
        realCost: created.price,
        warehouseId: originWarehouse.id,
        warehouseSlug: originWarehouse.slug,
      },
    });

    const updated = await this.ordersRepository.getById(orderId);
    return updated ?? order;
  }

  /**
   * Orders created before multi-warehouse stock already had their cards +
   * packaging decremented at checkout time (against the single warehouse
   * that existed then, backfilled to "principal"). For those, we must NOT
   * decrement again — we just ship from wherever their stock actually came
   * from, ignoring whatever the admin picked in the selector. Only brand
   * new orders (no "sale" movements yet) get stock decremented here, from
   * the admin-selected warehouse.
   */
  private async resolveOriginWarehouse(
    orderId: string,
    cardUnits: number,
    selectedWarehouse: Warehouse,
  ): Promise<Warehouse> {
    const existingMovements =
      await this.inventoryMovementsRepository.listByOrder(orderId);
    const existingSale = existingMovements.find(
      (movement) => movement.movementType === "sale" && movement.warehouseId,
    );

    if (existingSale?.warehouseId) {
      const alreadyReservedWarehouse = await this.warehousesRepository.getById(
        existingSale.warehouseId,
      );

      if (alreadyReservedWarehouse) {
        return alreadyReservedWarehouse;
      }
    }

    await this.reserveStockAtWarehouse(orderId, cardUnits, selectedWarehouse);
    return selectedWarehouse;
  }

  private async reserveStockAtWarehouse(
    orderId: string,
    cardUnits: number,
    warehouse: Warehouse,
  ): Promise<void> {
    const cardsProduct = await this.productsRepository.getBySku(CARDS_SKU);

    if (!cardsProduct) {
      throw new Error(`Cards product ${CARDS_SKU} not found`);
    }

    const packaging = await this.productsRepository.getBySku(PACKAGING_SKU);

    if (!packaging) {
      throw new Error(`Packaging product ${PACKAGING_SKU} not found`);
    }

    const cardsStock = await this.productStockRepository.decrementStock(
      cardsProduct.id,
      warehouse.id,
      cardUnits,
    );

    if (cardsStock === null) {
      throw new InsufficientStockError(cardsProduct.id);
    }

    const packagingStock = await this.productStockRepository.decrementStock(
      packaging.id,
      warehouse.id,
      cardUnits,
    );

    if (packagingStock === null) {
      await this.productStockRepository.incrementStock(
        cardsProduct.id,
        warehouse.id,
        cardUnits,
      );
      throw new InsufficientStockError(packaging.id);
    }

    await Promise.all([
      this.inventoryMovementsRepository.record({
        productId: cardsProduct.id,
        movementType: "sale",
        quantityDelta: -cardUnits,
        stockAfter: cardsStock,
        orderId,
        warehouseId: warehouse.id,
      }),
      this.inventoryMovementsRepository.record({
        productId: packaging.id,
        movementType: "sale",
        quantityDelta: -cardUnits,
        stockAfter: packagingStock,
        orderId,
        warehouseId: warehouse.id,
      }),
    ]);
  }
}
