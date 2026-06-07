import {
  getPaymentAttemptByExternalReference,
  getPaymentAttemptByPreferenceId,
  syncPaymentAttemptFromExternalReference,
  syncPaymentAttemptFromPaymentId,
  syncPaymentAttemptFromPreferenceId,
  type PaymentAttemptLookup,
} from "@/lib/payments/payment-attempts";

type PaymentReturnSearchParams = Record<string, string | string[] | undefined>;

export type PaymentReturnParams = {
  collectionId: string | null;
  externalReference: string | null;
  merchantOrderId: string | null;
  paymentId: string | null;
  preferenceId: string | null;
  status: string | null;
};

function readSingle(value: string | string[] | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function readPaymentReturnParams(params: PaymentReturnSearchParams): PaymentReturnParams {
  return {
    collectionId: readSingle(params.collection_id),
    externalReference: readSingle(params.external_reference),
    merchantOrderId: readSingle(params.merchant_order_id),
    paymentId: readSingle(params.payment_id),
    preferenceId: readSingle(params.preference_id),
    status: readSingle(params.status),
  };
}

export function buildPaymentReturnPath(
  kind: "success" | "pending" | "failure",
  params: PaymentReturnSearchParams,
  basePath = "/pago",
) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value.length > 0) {
      search.set(key, value);
    }
  }

  const query = search.toString();
  return query ? `${basePath}/${kind}?${query}` : `${basePath}/${kind}`;
}

export async function resolvePaymentReturn(params: PaymentReturnParams) {
  let attempt: PaymentAttemptLookup | null = null;
  let syncResult: Awaited<ReturnType<typeof syncPaymentAttemptFromExternalReference>> | null = null;

  if (params.paymentId) {
    syncResult = await syncPaymentAttemptFromPaymentId(params.paymentId);
    attempt = syncResult?.attempt ?? null;
  }

  if (!attempt && params.collectionId && params.collectionId !== params.paymentId) {
    syncResult = await syncPaymentAttemptFromPaymentId(params.collectionId);
    attempt = syncResult?.attempt ?? null;
  }

  if (!attempt && params.externalReference) {
    attempt = await getPaymentAttemptByExternalReference(params.externalReference);
    syncResult = attempt ? await syncPaymentAttemptFromExternalReference(params.externalReference) : null;
    attempt = syncResult?.attempt ?? attempt;
  }

  if (!attempt && params.preferenceId) {
    attempt = await getPaymentAttemptByPreferenceId(params.preferenceId);
    syncResult = attempt ? await syncPaymentAttemptFromPreferenceId(params.preferenceId) : null;
    attempt = syncResult?.attempt ?? attempt;
  }

  return {
    attempt,
    syncResult,
  };
}
