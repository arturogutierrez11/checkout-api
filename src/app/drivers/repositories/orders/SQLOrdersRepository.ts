import { Injectable } from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import { EntityManager } from "typeorm";
import { IOrdersRepository } from "../../../../core/adapters/repositories/orders/IOrdersRepository";
import {
  CreateManualOrderData,
  CreateOrderData,
  MarkShippedData,
  Order,
  OrderStatus,
  SaveShipmentData,
  ShippingStatus,
  UpdateMpPaymentInfoData,
} from "../../../../core/entities/orders/Order";

interface OrderRow {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  unitPrice: string;
  quantity: number;
  currency: string;
  subtotal: string;
  shippingMethod: string;
  shippingPrice: string;
  total: string;
  status: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingProvince: string;
  shippingPostalCode: string;
  billingDni: string;
  billingUseShippingAddress: boolean;
  billingAddress: string | null;
  billingCity: string | null;
  billingProvince: string | null;
  billingPostalCode: string | null;
  isBusinessPurchase: boolean;
  billingCuit: string | null;
  billingBusinessName: string | null;
  mpPreferenceId: string | null;
  mpInitPoint: string | null;
  mpPaymentId: string | null;
  mpPaymentStatus: string | null;
  mpPaymentStatusDetail: string | null;
  salesChannel: string;
  manualPaymentMethod: string | null;
  manualPaymentNote: string | null;
  assignedAdminId: string | null;
  shippingStatus: string;
  shippingCarrier: string | null;
  shippingTrackingNumber: string | null;
  shippingLabelUrl: string | null;
  shippedAt: Date | string | null;
  shippingRealCost: string | null;
  shippingZipnovaShipmentId: string | null;
  shippingZipnovaStatus: string | null;
  invoiceStatus: string | null;
  invoiceCae: string | null;
  invoiceType: string | null;
  invoiceNumber: string | null;
  invoicedAt: Date | string | null;
  approvedAt: Date | string | null;
  emailSentAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

const ORDER_COLUMNS = `
  id,
  product_id as "productId",
  product_sku as "productSku",
  product_name as "productName",
  unit_price as "unitPrice",
  quantity,
  currency,
  subtotal,
  shipping_method as "shippingMethod",
  shipping_price as "shippingPrice",
  total,
  status,
  customer_first_name as "customerFirstName",
  customer_last_name as "customerLastName",
  customer_email as "customerEmail",
  customer_phone as "customerPhone",
  shipping_address as "shippingAddress",
  shipping_city as "shippingCity",
  shipping_province as "shippingProvince",
  shipping_postal_code as "shippingPostalCode",
  billing_dni as "billingDni",
  billing_use_shipping_address as "billingUseShippingAddress",
  billing_address as "billingAddress",
  billing_city as "billingCity",
  billing_province as "billingProvince",
  billing_postal_code as "billingPostalCode",
  is_business_purchase as "isBusinessPurchase",
  billing_cuit as "billingCuit",
  billing_business_name as "billingBusinessName",
  mp_preference_id as "mpPreferenceId",
  mp_init_point as "mpInitPoint",
  mp_payment_id as "mpPaymentId",
  mp_payment_status as "mpPaymentStatus",
  mp_payment_status_detail as "mpPaymentStatusDetail",
  sales_channel as "salesChannel",
  manual_payment_method as "manualPaymentMethod",
  manual_payment_note as "manualPaymentNote",
  assigned_admin_id as "assignedAdminId",
  shipping_status as "shippingStatus",
  shipping_carrier as "shippingCarrier",
  shipping_tracking_number as "shippingTrackingNumber",
  shipping_label_url as "shippingLabelUrl",
  shipped_at as "shippedAt",
  shipping_real_cost as "shippingRealCost",
  shipping_zipnova_shipment_id as "shippingZipnovaShipmentId",
  shipping_zipnova_status as "shippingZipnovaStatus",
  invoice_status as "invoiceStatus",
  invoice_cae as "invoiceCae",
  invoice_type as "invoiceType",
  invoice_number as "invoiceNumber",
  invoiced_at as "invoicedAt",
  approved_at as "approvedAt",
  email_sent_at as "emailSentAt",
  created_at as "createdAt",
  updated_at as "updatedAt"
`;

@Injectable()
export class SQLOrdersRepository implements IOrdersRepository {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async create(data: CreateOrderData): Promise<Order> {
    const rows = await this.queryRows<OrderRow>(
      `
        insert into checkout_orders (
          product_id, product_sku, product_name, unit_price, quantity, currency, subtotal,
          shipping_method, shipping_price, total,
          customer_first_name, customer_last_name, customer_email, customer_phone,
          shipping_address, shipping_city, shipping_province, shipping_postal_code,
          billing_dni, billing_use_shipping_address, billing_address, billing_city,
          billing_province, billing_postal_code, is_business_purchase, billing_cuit,
          billing_business_name
        )
        values (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10,
          $11, $12, $13, $14,
          $15, $16, $17, $18,
          $19, $20, $21, $22,
          $23, $24, $25, $26,
          $27
        )
        returning ${ORDER_COLUMNS}
      `,
      [
        data.productId,
        data.productSku,
        data.productName,
        data.unitPrice,
        data.quantity,
        data.currency,
        data.subtotal,
        data.shippingMethod,
        data.shippingPrice,
        data.total,
        data.customerFirstName,
        data.customerLastName,
        data.customerEmail,
        data.customerPhone,
        data.shippingAddress,
        data.shippingCity,
        data.shippingProvince,
        data.shippingPostalCode,
        data.billingDni,
        data.billingUseShippingAddress,
        data.billingAddress,
        data.billingCity,
        data.billingProvince,
        data.billingPostalCode,
        data.isBusinessPurchase,
        data.billingCuit,
        data.billingBusinessName,
      ],
    );

    return this.mapRowToOrder(rows[0]);
  }

  async createManual(data: CreateManualOrderData): Promise<Order> {
    const rows = await this.queryRows<OrderRow>(
      `
        insert into checkout_orders (
          product_id, product_sku, product_name, unit_price, quantity, currency, subtotal,
          shipping_method, shipping_price, total,
          customer_first_name, customer_last_name, customer_email, customer_phone,
          shipping_address, shipping_city, shipping_province, shipping_postal_code,
          billing_dni, billing_use_shipping_address, billing_address, billing_city,
          billing_province, billing_postal_code, is_business_purchase, billing_cuit,
          billing_business_name, status, sales_channel, manual_payment_method,
          manual_payment_note, approved_at
        )
        values (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10,
          $11, $12, $13, $14,
          $15, $16, $17, $18,
          $19, $20, $21, $22,
          $23, $24, $25, $26,
          $27, 'approved', 'manual', $28,
          $29, now()
        )
        returning ${ORDER_COLUMNS}
      `,
      [
        data.productId,
        data.productSku,
        data.productName,
        data.unitPrice,
        data.quantity,
        data.currency,
        data.subtotal,
        data.shippingMethod,
        data.shippingPrice,
        data.total,
        data.customerFirstName,
        data.customerLastName,
        data.customerEmail,
        data.customerPhone,
        data.shippingAddress,
        data.shippingCity,
        data.shippingProvince,
        data.shippingPostalCode,
        data.billingDni,
        data.billingUseShippingAddress,
        data.billingAddress,
        data.billingCity,
        data.billingProvince,
        data.billingPostalCode,
        data.isBusinessPurchase,
        data.billingCuit,
        data.billingBusinessName,
        data.manualPaymentMethod,
        data.manualPaymentNote,
      ],
    );

    return this.mapRowToOrder(rows[0]);
  }

  async getById(id: string): Promise<Order | null> {
    const rows = await this.queryRows<OrderRow>(
      `select ${ORDER_COLUMNS} from checkout_orders where id = $1`,
      [id],
    );

    return rows[0] ? this.mapRowToOrder(rows[0]) : null;
  }

  async findByZipnovaShipmentId(shipmentId: string): Promise<Order | null> {
    const rows = await this.queryRows<OrderRow>(
      `select ${ORDER_COLUMNS} from checkout_orders where shipping_zipnova_shipment_id = $1`,
      [shipmentId],
    );

    return rows[0] ? this.mapRowToOrder(rows[0]) : null;
  }

  async list(filter: {
    status?: OrderStatus;
    limit: number;
    offset: number;
  }): Promise<Order[]> {
    if (filter.status) {
      const rows = await this.queryRows<OrderRow>(
        `
          select ${ORDER_COLUMNS} from checkout_orders
          where status = $1
          order by created_at desc
          limit $2 offset $3
        `,
        [filter.status, filter.limit, filter.offset],
      );
      return rows.map((row) => this.mapRowToOrder(row));
    }

    const rows = await this.queryRows<OrderRow>(
      `
        select ${ORDER_COLUMNS} from checkout_orders
        order by created_at desc
        limit $1 offset $2
      `,
      [filter.limit, filter.offset],
    );
    return rows.map((row) => this.mapRowToOrder(row));
  }

  async setMpPreference(
    orderId: string,
    preferenceId: string,
    initPoint: string,
  ): Promise<void> {
    await this.entityManager.query(
      `
        update checkout_orders
        set mp_preference_id = $2, mp_init_point = $3, updated_at = now()
        where id = $1
      `,
      [orderId, preferenceId, initPoint],
    );
  }

  async markPaymentInitFailed(orderId: string): Promise<void> {
    await this.entityManager.query(
      `
        update checkout_orders
        set status = 'payment_init_failed', updated_at = now()
        where id = $1 and status = 'pending'
      `,
      [orderId],
    );
  }

  async transitionStatusFromPending(
    orderId: string,
    toStatus: Extract<OrderStatus, "approved" | "rejected" | "cancelled">,
    mp: UpdateMpPaymentInfoData,
  ): Promise<boolean> {
    const approvedAtClause = toStatus === "approved" ? "now()" : "null";

    const rows = await this.queryRows<{ id: string }>(
      `
        update checkout_orders
        set
          status = $2,
          mp_payment_id = $3,
          mp_payment_status = $4,
          mp_payment_status_detail = $5,
          approved_at = ${approvedAtClause},
          updated_at = now()
        where id = $1 and status = 'pending'
        returning id
      `,
      [
        orderId,
        toStatus,
        mp.mpPaymentId,
        mp.mpPaymentStatus,
        mp.mpPaymentStatusDetail,
      ],
    );

    return rows.length > 0;
  }

  async updateMpPaymentInfo(
    orderId: string,
    mp: UpdateMpPaymentInfoData,
  ): Promise<void> {
    await this.entityManager.query(
      `
        update checkout_orders
        set mp_payment_id = $2, mp_payment_status = $3, mp_payment_status_detail = $4, updated_at = now()
        where id = $1
      `,
      [orderId, mp.mpPaymentId, mp.mpPaymentStatus, mp.mpPaymentStatusDetail],
    );
  }

  async markEmailSent(orderId: string): Promise<boolean> {
    const rows = await this.queryRows<{ id: string }>(
      `
        update checkout_orders
        set email_sent_at = now(), updated_at = now()
        where id = $1 and email_sent_at is null
        returning id
      `,
      [orderId],
    );

    return rows.length > 0;
  }

  async clearEmailSent(orderId: string): Promise<void> {
    await this.entityManager.query(
      `
        update checkout_orders
        set email_sent_at = null, updated_at = now()
        where id = $1
      `,
      [orderId],
    );
  }

  async cancelPending(orderId: string): Promise<boolean> {
    const rows = await this.queryRows<{ id: string }>(
      `
        update checkout_orders
        set status = 'cancelled', updated_at = now()
        where id = $1 and status = 'pending'
        returning id
      `,
      [orderId],
    );

    return rows.length > 0;
  }

  async markShipped(orderId: string, data: MarkShippedData): Promise<boolean> {
    const rows = await this.queryRows<{ id: string }>(
      `
        update checkout_orders
        set
          shipped_at = now(),
          shipping_status = 'shipped',
          shipping_carrier = $2,
          shipping_tracking_number = $3,
          shipping_label_url = $4,
          updated_at = now()
        where id = $1 and status = 'approved' and shipped_at is null
        returning id
      `,
      [orderId, data.carrier, data.trackingNumber, data.labelUrl],
    );

    return rows.length > 0;
  }

  async saveShipmentDetails(
    orderId: string,
    data: SaveShipmentData,
  ): Promise<boolean> {
    const rows = await this.queryRows<{ id: string }>(
      `
        update checkout_orders
        set
          shipping_carrier = $2,
          shipping_tracking_number = $3,
          shipping_real_cost = $4,
          shipping_zipnova_shipment_id = $5,
          updated_at = now()
        where id = $1 and shipping_zipnova_shipment_id is null
        returning id
      `,
      [
        orderId,
        data.carrier,
        data.trackingNumber,
        data.realCost,
        data.zipnovaShipmentId,
      ],
    );

    return rows.length > 0;
  }

  async resetShippingLabel(orderId: string): Promise<boolean> {
    const rows = await this.queryRows<{ id: string }>(
      `
        update checkout_orders
        set
          shipping_zipnova_shipment_id = null,
          shipping_carrier = null,
          shipping_tracking_number = null,
          shipping_label_url = null,
          shipping_real_cost = null,
          shipping_zipnova_status = null,
          shipping_status = 'pending_dispatch',
          shipped_at = null,
          updated_at = now()
        where id = $1 and shipping_zipnova_shipment_id is not null
        returning id
      `,
      [orderId],
    );

    return rows.length > 0;
  }

  async assignAdmin(
    orderId: string,
    adminUserId: string | null,
  ): Promise<boolean> {
    const rows = await this.queryRows<{ id: string }>(
      `
        update checkout_orders
        set assigned_admin_id = $2, updated_at = now()
        where id = $1
        returning id
      `,
      [orderId, adminUserId],
    );

    return rows.length > 0;
  }

  async setShippingStatus(
    orderId: string,
    status: ShippingStatus,
  ): Promise<boolean> {
    const rows = await this.queryRows<{ id: string }>(
      `
        update checkout_orders
        set
          shipping_status = $2,
          shipped_at = case
            when $2 = 'shipped' and shipped_at is null then now()
            else shipped_at
          end,
          updated_at = now()
        where id = $1
        returning id
      `,
      [orderId, status],
    );

    return rows.length > 0;
  }

  async updateZipnovaRawStatus(
    orderId: string,
    rawStatus: string,
  ): Promise<void> {
    await this.entityManager.query(
      `
        update checkout_orders
        set shipping_zipnova_status = $2, updated_at = now()
        where id = $1
      `,
      [orderId, rawStatus],
    );
  }

  async setInvoiceStatus(orderId: string, invoiced: boolean): Promise<boolean> {
    const rows = await this.queryRows<{ id: string }>(
      `
        update checkout_orders
        set
          invoice_status = $2,
          invoiced_at = case when $2 = 'invoiced' then now() else null end,
          updated_at = now()
        where id = $1
        returning id
      `,
      [orderId, invoiced ? "invoiced" : null],
    );

    return rows.length > 0;
  }

  private mapRowToOrder(row: OrderRow): Order {
    return {
      id: row.id,
      productId: row.productId,
      productSku: row.productSku,
      productName: row.productName,
      unitPrice: Number(row.unitPrice),
      quantity: row.quantity,
      currency: row.currency,
      subtotal: Number(row.subtotal),
      shippingMethod: row.shippingMethod as Order["shippingMethod"],
      shippingPrice: Number(row.shippingPrice),
      total: Number(row.total),
      status: row.status as OrderStatus,
      customerFirstName: row.customerFirstName,
      customerLastName: row.customerLastName,
      customerEmail: row.customerEmail,
      customerPhone: row.customerPhone,
      shippingAddress: row.shippingAddress,
      shippingCity: row.shippingCity,
      shippingProvince: row.shippingProvince,
      shippingPostalCode: row.shippingPostalCode,
      billingDni: row.billingDni,
      billingUseShippingAddress: row.billingUseShippingAddress,
      billingAddress: row.billingAddress,
      billingCity: row.billingCity,
      billingProvince: row.billingProvince,
      billingPostalCode: row.billingPostalCode,
      isBusinessPurchase: row.isBusinessPurchase,
      billingCuit: row.billingCuit,
      billingBusinessName: row.billingBusinessName,
      mpPreferenceId: row.mpPreferenceId,
      mpInitPoint: row.mpInitPoint,
      mpPaymentId: row.mpPaymentId,
      mpPaymentStatus: row.mpPaymentStatus,
      mpPaymentStatusDetail: row.mpPaymentStatusDetail,
      salesChannel: row.salesChannel as Order["salesChannel"],
      manualPaymentMethod: row.manualPaymentMethod,
      manualPaymentNote: row.manualPaymentNote,
      assignedAdminId: row.assignedAdminId,
      shippingStatus: row.shippingStatus as Order["shippingStatus"],
      shippingCarrier: row.shippingCarrier,
      shippingTrackingNumber: row.shippingTrackingNumber,
      shippingLabelUrl: row.shippingLabelUrl,
      shippedAt: this.toNullableDate(row.shippedAt),
      shippingRealCost:
        row.shippingRealCost === null ? null : Number(row.shippingRealCost),
      shippingZipnovaShipmentId: row.shippingZipnovaShipmentId,
      shippingZipnovaStatus: row.shippingZipnovaStatus,
      invoiceStatus: row.invoiceStatus,
      invoiceCae: row.invoiceCae,
      invoiceType: row.invoiceType,
      invoiceNumber: row.invoiceNumber,
      invoicedAt: this.toNullableDate(row.invoicedAt),
      approvedAt: this.toNullableDate(row.approvedAt),
      emailSentAt: this.toNullableDate(row.emailSentAt),
      createdAt: this.toDate(row.createdAt),
      updatedAt: this.toDate(row.updatedAt),
    };
  }

  private toDate(value: unknown): Date {
    const date = value instanceof Date ? value : new Date(String(value));

    if (Number.isNaN(date.getTime())) {
      throw new Error("Invalid order date");
    }

    return date;
  }

  private toNullableDate(value: unknown): Date | null {
    if (value === null || value === undefined) {
      return null;
    }

    return this.toDate(value);
  }

  private async queryRows<T>(sql: string, params: unknown[]): Promise<T[]> {
    const result: unknown = await this.entityManager.query(sql, params);

    if (
      Array.isArray(result) &&
      result.length === 2 &&
      Array.isArray(result[0]) &&
      typeof result[1] === "number"
    ) {
      return result[0] as T[];
    }

    return result as T[];
  }
}
