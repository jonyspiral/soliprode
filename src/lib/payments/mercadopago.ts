import {
  getBaseUrl,
  getMercadoPagoAccessToken,
  getMercadoPagoWebhookSecret,
} from "@/lib/payments/config";

type MercadoPagoPreferenceRequest = {
  items: Array<{
    title: string;
    quantity: number;
    currency_id: string;
    unit_price: number;
  }>;
  payer?: {
    email?: string | null;
  };
  external_reference: string;
  back_urls: {
    success: string;
    pending: string;
    failure: string;
  };
  notification_url?: string;
  auto_return?: "approved";
};

export type MercadoPagoPreferenceResponse = {
  id: string;
  init_point: string | null;
  sandbox_init_point: string | null;
};

export type MercadoPagoPaymentInfo = {
  id: number | string;
  status: string;
  status_detail?: string | null;
  transaction_amount: number;
  currency_id?: string | null;
  external_reference?: string | null;
};

type MercadoPagoPaymentsSearchResponse = {
  results?: MercadoPagoPaymentInfo[];
};

const MERCADO_PAGO_API_BASE = "https://api.mercadopago.com";

function buildHeaders() {
  return {
    Authorization: `Bearer ${getMercadoPagoAccessToken()}`,
    "Content-Type": "application/json",
  };
}

export function getMercadoPagoNotificationUrl() {
  const baseUrl = getBaseUrl();
  const webhookSecret = getMercadoPagoWebhookSecret();

  if (!webhookSecret) {
    return `${baseUrl}/api/payments/mercadopago/webhook`;
  }

  const url = new URL(`${baseUrl}/api/payments/mercadopago/webhook`);
  url.searchParams.set("token", webhookSecret);
  return url.toString();
}

export async function createMercadoPagoPreference(
  request: MercadoPagoPreferenceRequest,
): Promise<MercadoPagoPreferenceResponse> {
  const response = await fetch(`${MERCADO_PAGO_API_BASE}/checkout/preferences`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(request),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mercado Pago preference error: ${response.status} ${errorText}`);
  }

  return (await response.json()) as MercadoPagoPreferenceResponse;
}

export async function getMercadoPagoPayment(paymentId: string | number) {
  const response = await fetch(`${MERCADO_PAGO_API_BASE}/v1/payments/${paymentId}`, {
    method: "GET",
    headers: buildHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mercado Pago payment error: ${response.status} ${errorText}`);
  }

  return (await response.json()) as MercadoPagoPaymentInfo;
}

export async function searchMercadoPagoPaymentByExternalReference(externalReference: string) {
  const url = new URL(`${MERCADO_PAGO_API_BASE}/v1/payments/search`);
  url.searchParams.set("external_reference", externalReference);
  url.searchParams.set("sort", "date_created");
  url.searchParams.set("criteria", "desc");
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    method: "GET",
    headers: buildHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mercado Pago search error: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as MercadoPagoPaymentsSearchResponse;
  return data.results?.[0] ?? null;
}

export function resolveMercadoPagoCheckoutUrl(preference: MercadoPagoPreferenceResponse) {
  return preference.sandbox_init_point || preference.init_point || null;
}
