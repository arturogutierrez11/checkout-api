import { Injectable } from "@nestjs/common";
import { IOrderEmailSender } from "../../../core/adapters/services/orderEmail/IOrderEmailSender";
import { Order } from "../../../core/entities/orders/Order";
import { env } from "../../../config/env";

const RESEND_EMAILS_ENDPOINT = "https://api.resend.com/emails";
const LOGO_URL = "https://rituo.io/images/rituo-logo-white.png";
const INK = "#0d1528";
const MUTED = "#5b6b82";
const BORDER = "#e4e9f0";
const SURFACE = "#f6f8fb";
const ACCENT = "#2f4d7a";

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

interface SummaryRow {
  label: string;
  value: string;
}

function summaryTable(rows: SummaryRow[]): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${rows
        .map(
          (row, index) => `
        <tr>
          <td style="padding:${index === 0 ? "0" : "12px"} 0 0; color:${MUTED}; font-size:13px; font-family:Arial,Helvetica,sans-serif; width:40%; vertical-align:top;">
            ${escapeHtml(row.label)}
          </td>
          <td style="padding:${index === 0 ? "0" : "12px"} 0 0; color:${INK}; font-size:14px; font-weight:600; font-family:Arial,Helvetica,sans-serif; text-align:right; vertical-align:top;">
            ${row.value}
          </td>
        </tr>
      `,
        )
        .join("")}
    </table>
  `;
}

/** Wraps arbitrary body HTML in the shared Rituo email shell (header band, card, footer). */
function emailShell(options: {
  preheader: string;
  eyebrow: string;
  heading: string;
  intro: string;
  bodyHtml: string;
  footerNote?: string;
}): string {
  return `
<!doctype html>
<html lang="es">
  <body style="margin:0; padding:0; background:${SURFACE}; font-family:Arial,Helvetica,sans-serif;">
    <span style="display:none; max-height:0; overflow:hidden; opacity:0;">${escapeHtml(options.preheader)}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SURFACE}; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; background:#ffffff; border-radius:20px; overflow:hidden; border:1px solid ${BORDER};">
            <tr>
              <td style="background:${INK}; padding:28px 32px;">
                <img src="${LOGO_URL}" alt="Rituo" width="86" height="50" style="display:block; height:auto;" />
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 8px;">
                <p style="margin:0 0 8px; color:${ACCENT}; font-size:11px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase;">
                  ${escapeHtml(options.eyebrow)}
                </p>
                <h1 style="margin:0 0 14px; color:${INK}; font-size:24px; font-weight:800; letter-spacing:-0.02em;">
                  ${escapeHtml(options.heading)}
                </h1>
                <p style="margin:0 0 24px; color:${MUTED}; font-size:14px; line-height:1.6;">
                  ${options.intro}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px;">
                <div style="background:${SURFACE}; border:1px solid ${BORDER}; border-radius:14px; padding:22px 20px;">
                  ${options.bodyHtml}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 28px; border-top:1px solid ${BORDER};">
                <p style="margin:0; color:${MUTED}; font-size:12px; line-height:1.6;">
                  ${options.footerNote ?? "¿Alguna duda? Respondé este email o escribinos a hello@rituo.io."}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `;
}

@Injectable()
export class ResendOrderEmailSender implements IOrderEmailSender {
  async sendOrderConfirmation(order: Order): Promise<void> {
    const total = formatCurrency(order.total, order.currency);
    const shippingLabel =
      order.shippingMethod === "express" ? "Envío express" : "Envío estándar";
    const unitParts = [
      order.shippingFloor ? `Piso ${order.shippingFloor}` : null,
      order.shippingApartment ? `Depto ${order.shippingApartment}` : null,
    ].filter(Boolean);
    const street = unitParts.length
      ? `${order.shippingAddress} (${unitParts.join(", ")})`
      : order.shippingAddress;
    const addressLine = `${street}, ${order.shippingCity}, ${order.shippingProvince} (${order.shippingPostalCode})`;

    const summaryRows: SummaryRow[] = [
      {
        label: "Producto",
        value: `${escapeHtml(order.productName)} × ${order.quantity}`,
      },
      { label: "Envío", value: `${escapeHtml(shippingLabel)}` },
      { label: "Dirección", value: escapeHtml(addressLine) },
      ...(order.discountAmount > 0
        ? [
            {
              label: "Descuento por transferencia",
              value: `−${formatCurrency(order.discountAmount, order.currency)}`,
            },
          ]
        : []),
      { label: "Total pagado", value: total },
      { label: "N° de orden", value: escapeHtml(order.id) },
      order.salesChannel === "manual"
        ? {
            label: "Medio de pago",
            value: escapeHtml(order.manualPaymentMethod ?? "—"),
          }
        : order.salesChannel === "bank_transfer"
          ? { label: "Medio de pago", value: "Transferencia bancaria" }
          : {
              label: "N° de pago Mercado Pago",
              value: escapeHtml(order.mpPaymentId ?? "—"),
            },
    ];
    const paymentLine =
      order.salesChannel === "manual"
        ? `Medio de pago: ${order.manualPaymentMethod ?? ""}`
        : order.salesChannel === "bank_transfer"
          ? "Medio de pago: transferencia bancaria"
          : `Pago MP: ${order.mpPaymentId ?? ""}`;

    await Promise.all([
      this.send({
        to: [order.customerEmail],
        subject: "Confirmamos tu pago — Rituo",
        text: `Hola ${order.customerFirstName}, confirmamos tu pago de ${total} por ${order.productName}. Vamos a coordinar el envío a ${addressLine} y te avisamos por email en cuanto tengamos el número de seguimiento. N° de orden: ${order.id}.`,
        html: emailShell({
          preheader: `Confirmamos tu pago de ${total} — te avisamos apenas tengamos el seguimiento del envío.`,
          eyebrow: "Pago confirmado",
          heading: `¡Gracias por tu compra, ${escapeHtml(order.customerFirstName)}!`,
          intro:
            "Ya confirmamos tu pago y estamos preparando tu envío. En cuanto despachemos tu pedido, te vamos a mandar otro email con el número de seguimiento para que puedas rastrearlo.",
          bodyHtml: summaryTable(summaryRows),
        }),
        tags: [
          { name: "source", value: "checkout_api" },
          { name: "type", value: "order_confirmation" },
        ],
      }),
      this.send({
        to: [env.resendOrdersNotifyTo],
        reply_to: order.customerEmail,
        subject: `[Pedido pago] ${order.productName} — ${order.customerFirstName} ${order.customerLastName}`,
        text: `Nuevo pedido pago${order.salesChannel === "manual" ? " (venta manual)" : ""}.\n\nCliente: ${order.customerFirstName} ${order.customerLastName} (${order.customerEmail}, ${order.customerPhone})\n\n${order.productName} x${order.quantity}\n${shippingLabel}\nDirección: ${addressLine}\nTotal: ${total}\nOrden: ${order.id}\n${paymentLine}`,
        html: emailShell({
          preheader: `Nuevo pedido pago de ${order.customerFirstName} ${order.customerLastName} — ${total}`,
          eyebrow: "Panel interno",
          heading: "Nuevo pedido pago",
          intro: `<strong style="color:${INK};">${escapeHtml(order.customerFirstName)} ${escapeHtml(order.customerLastName)}</strong> — ${escapeHtml(order.customerEmail)} · ${escapeHtml(order.customerPhone)}`,
          bodyHtml: summaryTable(summaryRows),
          footerNote:
            "Marcalo como enviado desde el panel de admin cuando salga por correo.",
        }),
        tags: [
          { name: "source", value: "checkout_api" },
          { name: "type", value: "order_notification" },
        ],
      }),
    ]);
  }

  async sendTransferInstructions(order: Order): Promise<void> {
    const total = formatCurrency(order.total, order.currency);
    const discount = formatCurrency(order.discountAmount, order.currency);
    const unitParts = [
      order.shippingFloor ? `Piso ${order.shippingFloor}` : null,
      order.shippingApartment ? `Depto ${order.shippingApartment}` : null,
    ].filter(Boolean);
    const street = unitParts.length
      ? `${order.shippingAddress} (${unitParts.join(", ")})`
      : order.shippingAddress;
    const addressLine = `${street}, ${order.shippingCity}, ${order.shippingProvince} (${order.shippingPostalCode})`;

    const bankRows: SummaryRow[] = [
      { label: "Importe a transferir", value: total },
      ...(env.bankTransferHolder
        ? [{ label: "Titular", value: escapeHtml(env.bankTransferHolder) }]
        : []),
      ...(env.bankTransferCuit
        ? [{ label: "CUIT/CUIL", value: escapeHtml(env.bankTransferCuit) }]
        : []),
      ...(env.bankTransferBank
        ? [{ label: "Banco", value: escapeHtml(env.bankTransferBank) }]
        : []),
      ...(env.bankTransferCbu
        ? [{ label: "CBU", value: escapeHtml(env.bankTransferCbu) }]
        : []),
      ...(env.bankTransferAlias
        ? [{ label: "Alias", value: escapeHtml(env.bankTransferAlias) }]
        : []),
      { label: "N° de orden", value: escapeHtml(order.id) },
    ];

    const orderRows: SummaryRow[] = [
      {
        label: "Producto",
        value: `${escapeHtml(order.productName)} × ${order.quantity}`,
      },
      { label: "Dirección", value: escapeHtml(addressLine) },
      {
        label: "Descuento por transferencia",
        value: `−${discount}`,
      },
      { label: "Total a transferir", value: total },
      { label: "N° de orden", value: escapeHtml(order.id) },
    ];

    const bankText = [
      `Importe: ${total}`,
      env.bankTransferHolder ? `Titular: ${env.bankTransferHolder}` : null,
      env.bankTransferBank ? `Banco: ${env.bankTransferBank}` : null,
      env.bankTransferCbu ? `CBU: ${env.bankTransferCbu}` : null,
      env.bankTransferAlias ? `Alias: ${env.bankTransferAlias}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    await Promise.all([
      this.send({
        to: [order.customerEmail],
        subject: "Recibimos tu pedido: verificamos tu transferencia — Rituo",
        text: `Hola ${order.customerFirstName}, recibimos tu pedido de ${order.productName} y estamos verificando tu transferencia de ${total} (ya incluye el 10% de descuento). Si todavía no la hiciste, estos son los datos:\n\n${bankText}\n\nRespondé este email con el comprobante indicando tu N° de orden: ${order.id}. Apenas acreditemos el pago, te confirmamos y coordinamos el envío.`,
        html: emailShell({
          preheader: `Estamos verificando tu transferencia de ${total} — ya incluye el 10% de descuento.`,
          eyebrow: "Pedido recibido",
          heading: `¡Gracias, ${escapeHtml(order.customerFirstName)}! Verificamos tu transferencia`,
          intro: `Recibimos tu pedido y estamos verificando tu transferencia (el importe ya incluye el <strong style="color:${INK};">10% de descuento</strong>). Respondé este email con el comprobante, indicando tu N° de orden, para acelerar la confirmación. Si todavía no transferiste, usá los datos de abajo. Apenas acreditemos el pago te confirmamos y coordinamos el envío.`,
          bodyHtml: summaryTable(bankRows),
        }),
        tags: [
          { name: "source", value: "checkout_api" },
          { name: "type", value: "transfer_instructions" },
        ],
      }),
      this.send({
        to: [env.resendOrdersNotifyTo],
        reply_to: order.customerEmail,
        subject: `[Transferencia pendiente] ${order.productName} — ${order.customerFirstName} ${order.customerLastName}`,
        text: `Pedido por transferencia: el cliente indicó que ya transfirió, falta verificar la acreditación.\n\nCliente: ${order.customerFirstName} ${order.customerLastName} (${order.customerEmail}, ${order.customerPhone})\n\n${order.productName} x${order.quantity}\nDirección: ${addressLine}\nTotal a recibir: ${total} (descuento ${discount})\nOrden: ${order.id}\n\nCuando la transferencia esté acreditada, confirmala desde el panel de admin.`,
        html: emailShell({
          preheader: `Transferencia pendiente de ${order.customerFirstName} ${order.customerLastName} — ${total}`,
          eyebrow: "Panel interno",
          heading: "Pedido por transferencia pendiente",
          intro: `<strong style="color:${INK};">${escapeHtml(order.customerFirstName)} ${escapeHtml(order.customerLastName)}</strong> — ${escapeHtml(order.customerEmail)} · ${escapeHtml(order.customerPhone)}`,
          bodyHtml: summaryTable(orderRows),
          footerNote:
            "El cliente indicó que ya transfirió. Cuando veas la plata acreditada, tocá «Confirmar transferencia» en el panel de admin para aprobar el pedido.",
        }),
        tags: [
          { name: "source", value: "checkout_api" },
          { name: "type", value: "transfer_notification" },
        ],
      }),
    ]);
  }

  async sendOrderShipped(order: Order): Promise<void> {
    const carrierLine = order.shippingCarrier
      ? escapeHtml(order.shippingCarrier)
      : "Nuestro transportista";
    const trackingRows: SummaryRow[] = [
      {
        label: "Producto",
        value: `${escapeHtml(order.productName)} × ${order.quantity}`,
      },
      { label: "Transportista", value: carrierLine },
      {
        label: "N° de seguimiento",
        value: order.shippingTrackingNumber
          ? escapeHtml(order.shippingTrackingNumber)
          : "A confirmar",
      },
      { label: "N° de orden", value: escapeHtml(order.id) },
    ];

    const trackingCta = order.shippingLabelUrl
      ? `<a href="${escapeHtml(order.shippingLabelUrl)}" style="display:inline-block; margin-top:18px; padding:12px 22px; background:${INK}; color:#ffffff; font-size:13px; font-weight:700; text-decoration:none; border-radius:999px;">Rastrear mi envío</a>`
      : "";

    await this.send({
      to: [order.customerEmail],
      subject: "Tu pedido está en camino — Rituo",
      text: `Hola ${order.customerFirstName}, tu pedido ya salió con ${carrierLine}${
        order.shippingTrackingNumber
          ? ` (seguimiento: ${order.shippingTrackingNumber})`
          : ""
      }. N° de orden: ${order.id}.`,
      html: emailShell({
        preheader: `Tu Rituo ya está en camino con ${carrierLine}.`,
        eyebrow: "Pedido enviado",
        heading: `¡Tu Rituo está en camino, ${escapeHtml(order.customerFirstName)}!`,
        intro:
          "Despachamos tu pedido. Acá tenés los datos para hacerle seguimiento.",
        bodyHtml: `${summaryTable(trackingRows)}${trackingCta}`,
      }),
      tags: [
        { name: "source", value: "checkout_api" },
        { name: "type", value: "order_shipped" },
      ],
    });
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
