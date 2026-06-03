import {
  MercadoPagoConfig,
  Payment,
  Preference,
} from "mercadopago";

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
  approved_at?: string | null;
  id: number | string;
  status: string;
  status_detail?: string | null;
  transaction_amount: number;
  currency_id?: string | null;
  external_reference?: string | null;
};

let mercadoPagoConfig: MercadoPagoConfig | null = null;
type SdkPreferenceResponse = Awaited<ReturnType<Preference["create"]>>;
type SdkPaymentResponse = Awaited<ReturnType<Payment["get"]>>;
type SdkPaymentSearchResponse = Awaited<ReturnType<Payment["search"]>>;

function getMercadoPagoConfig() {
  if (!mercadoPagoConfig) {
    mercadoPagoConfig = new MercadoPagoConfig({
      accessToken: getMercadoPagoAccessToken(),
    });
  }

  return mercadoPagoConfig;
}

function getPreferenceClient() {
  return new Preference(getMercadoPagoConfig());
}

function getPaymentClient() {
  return new Payment(getMercadoPagoConfig());
}

function normalizePreferenceResponse(preference: SdkPreferenceResponse): MercadoPagoPreferenceResponse {
  return {
    id: preference.id ?? "",
    init_point: preference.init_point ?? null,
    sandbox_init_point: preference.sandbox_init_point ?? null,
  };
}

function normalizePaymentResponse(payment: SdkPaymentResponse): MercadoPagoPaymentInfo {
  return {
    approved_at: payment.date_approved ?? null,
    id: payment.id ?? "",
    status: payment.status ?? "unknown",
    status_detail: payment.status_detail ?? null,
    transaction_amount: Number(payment.transaction_amount ?? 0),
    currency_id: payment.currency_id ?? null,
    external_reference: payment.external_reference ?? null,
  };
}

function normalizePaymentSearchResult(
  payment: NonNullable<SdkPaymentSearchResponse["results"]>[number],
): MercadoPagoPaymentInfo {
  return {
    approved_at: payment.date_approved ?? null,
    id: payment.id ?? "",
    status: payment.status ?? "unknown",
    status_detail: payment.status_detail ?? null,
    transaction_amount: Number(payment.transaction_amount ?? 0),
    currency_id: payment.currency_id ?? null,
    external_reference: payment.external_reference ?? null,
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
  const preference = await getPreferenceClient().create({
    body: {
      items: request.items.map((item, index) => ({
        id: `soliprode-entry-${index + 1}`,
        title: item.title,
        quantity: item.quantity,
        currency_id: item.currency_id,
        unit_price: item.unit_price,
      })),
      payer: request.payer?.email ? { email: request.payer.email } : undefined,
      external_reference: request.external_reference,
      back_urls: request.back_urls,
      notification_url: request.notification_url,
      auto_return: request.auto_return,
    },
  });

  return normalizePreferenceResponse(preference);
}

export async function getMercadoPagoPayment(paymentId: string | number) {
  const payment = await getPaymentClient().get({
    id: paymentId,
  });

  return normalizePaymentResponse(payment);
}

export async function searchMercadoPagoPaymentByExternalReference(externalReference: string) {
  const searchResult = await getPaymentClient().search({
    options: {
      external_reference: externalReference,
      sort: "date_created",
      criteria: "desc",
      limit: 1,
    },
  });

  const payment = searchResult.results?.[0];
  return payment ? normalizePaymentSearchResult(payment) : null;
}

export function resolveMercadoPagoCheckoutUrl(preference: MercadoPagoPreferenceResponse) {
  return preference.init_point || preference.sandbox_init_point || null;
}
