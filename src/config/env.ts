import "dotenv/config";

export const env = {
  port: Number(process.env.PORT ?? 3001),
  serviceName: process.env.SERVICE_NAME ?? "rituo-checkout-api",
  databaseUrl: process.env.DATABASE_URL,
  checkoutInternalApiKey: process.env.CHECKOUT_INTERNAL_API_KEY,
  mercadoPagoAccessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  mercadoPagoWebhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET,
  zipnovaBaseUrl: (
    process.env.ZIPNOVA_BASE_URL ?? "https://api.zipnova.com.ar/v2"
  ).replace(/\/$/, ""),
  zipnovaApiToken: process.env.ZIPNOVA_API_TOKEN,
  zipnovaApiSecret: process.env.ZIPNOVA_API_SECRET,
  zipnovaAccountId: process.env.ZIPNOVA_ACCOUNT_ID,
  zipnovaOriginId: process.env.ZIPNOVA_ORIGIN_ID,
  resendApiKey: process.env.RESEND_API_KEY,
  resendFromEmail: process.env.RESEND_FROM_EMAIL,
  resendOrdersNotifyTo: process.env.RESEND_ORDERS_NOTIFY_TO ?? "hello@rituo.io",
  checkoutSiteUrl: (
    process.env.CHECKOUT_SITE_URL ?? "https://rituo.io"
  ).replace(/\/$/, ""),
  checkoutApiPublicUrl: (process.env.CHECKOUT_API_PUBLIC_URL ?? "").replace(
    /\/$/,
    "",
  ),
  corsOrigins: (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};
