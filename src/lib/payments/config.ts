export function getBaseUrl() {
  const value = process.env.NEXT_PUBLIC_BASE_URL?.trim();

  if (!value) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_BASE_URL");
  }

  return value.replace(/\/+$/, "");
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
