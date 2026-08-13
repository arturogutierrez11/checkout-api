import { Injectable } from "@nestjs/common";
import { IOrderEmailSender } from "../../../core/adapters/services/orderEmail/IOrderEmailSender";
import { Order } from "../../../core/entities/orders/Order";
import { env } from "../../../config/env";

const RESEND_EMAILS_ENDPOINT = "https://api.resend.com/emails";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

@Injectable()
export class ResendOrderEmailSender implements IOrderEmailSender {
  async sendOrderConfirmation(order: Order): Promise<void> {
    const total = formatCurrency(order.total, order.currency);
    const shippingLabel =
      order.shippingMethod === "express" ? "Envío express" : "Envío estándar";
    const addressLine = `${order.shippingAddress}, ${order.shippingCity}, ${order.shippingProvince} (${order.shippingPostalCode})`;

    const summaryHtml = `
      <p><strong>Producto:</strong> ${escapeHtml(order.productName)} x${order.quantity}</p>
      <p><strong>${shippingLabel}</strong></p>
      <p><strong>Dirección:</strong> ${escapeHtml(addressLine)}</p>
      <p><strong>Total pagado:</strong> ${total}</p>
      <p><strong>N° de orden:</strong> ${escapeHtml(order.id)}</p>
      <p><strong>N° de pago Mercado Pago:</strong> ${order.mpPaymentId ?? ""}</p>
    `;

    await Promise.all([
      this.send({
        to: [order.customerEmail],
        subject: "Confirmamos tu pago — Rituo",
        text: `Hola ${order.customerFirstName}, confirmamos tu pago de ${total} por ${order.productName}. Te contactaremos para coordinar el envío a ${addressLine}. N° de orden: ${order.id}.`,
        html: `
          <div style="font-family:Arial,sans-serif;color:#0d1528;line-height:1.6;">
            <h1 style="margin:0 0 20px;">¡Gracias por tu compra, ${escapeHtml(order.customerFirstName)}!</h1>
            <p>Confirmamos tu pago. Vamos a coordinar el envío a la brevedad.</p>
            <div style="margin-top:24px;padding:20px;border:1px solid #d8e0ea;border-radius:12px;">${summaryHtml}</div>
          </div>
        `,
        tags: [
          { name: "source", value: "checkout_api" },
          { name: "type", value: "order_confirmation" },
        ],
      }),
      this.send({
        to: [env.resendOrdersNotifyTo],
        reply_to: order.customerEmail,
        subject: `[Pedido pago] ${order.productName} — ${order.customerFirstName} ${order.customerLastName}`,
        text: `Nuevo pedido pago.\n\nCliente: ${order.customerFirstName} ${order.customerLastName} (${order.customerEmail}, ${order.customerPhone})\n\n${order.productName} x${order.quantity}\n${shippingLabel}\nDirección: ${addressLine}\nTotal: ${total}\nOrden: ${order.id}\nPago MP: ${order.mpPaymentId ?? ""}`,
        html: `
          <div style="font-family:Arial,sans-serif;color:#0d1528;line-height:1.6;">
            <h1 style="margin:0 0 20px;">Nuevo pedido pago</h1>
            <p><strong>Cliente:</strong> ${escapeHtml(order.customerFirstName)} ${escapeHtml(order.customerLastName)} — ${escapeHtml(order.customerEmail)} — ${escapeHtml(order.customerPhone)}</p>
            <div style="margin-top:24px;padding:20px;border:1px solid #d8e0ea;border-radius:12px;">${summaryHtml}</div>
          </div>
        `,
        tags: [
          { name: "source", value: "checkout_api" },
          { name: "type", value: "order_notification" },
        ],
      }),
    ]);
  }

  private async send(payload: Record<string, unknown>): Promise<void> {
    if (!env.resendApiKey || !env.resendFromEmail) {
      throw new Error("El servicio de correo no está configurado.");
    }

    const response = await fetch(RESEND_EMAILS_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: env.resendFromEmail, ...payload }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(
        `Resend rechazó el email (${response.status}): ${detail}`,
      );
    }
  }
}
