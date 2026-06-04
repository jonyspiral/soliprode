import { readConfiguredPublicSiteOrigin } from "@/lib/site-url";

export function getBaseUrl() {
  const value = readConfiguredPublicSiteOrigin();

  if (!value) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_BASE_URL");
  }

  return value;
}

export function getMercadoPagoAccessToken() {
  const value = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();

  if (!value) {
    throw new Error("Missing required environment variable: MERCADOPAGO_ACCESS_TOKEN");
  }

  return value;
}

export function hasMercadoPagoAccessToken() {
  return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN?.trim());
}

export function getMercadoPagoWebhookSecret() {
  return process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim() || null;
}
