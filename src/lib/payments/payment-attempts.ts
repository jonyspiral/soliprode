import { entryConfig } from "@/lib/product/entry-config";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import {
  createMercadoPagoPreference,
  getMercadoPagoNotificationUrl,
  getMercadoPagoPayment,
  resolveMercadoPagoCheckoutUrl,
  searchMercadoPagoPaymentByExternalReference,
  type MercadoPagoPaymentInfo,
} from "@/lib/payments/mercadopago";
import { getBaseUrl } from "@/lib/payments/config";

type ParticipationRow = {
  id: string;
  profile_id: string;
  payment_status: string;
  entry_price: number | null;
  entry_baseline_points: number | null;
};

type PaymentAttemptRow = {
  id: string;
  participation_id: string;
  profile_id: string;
  provider: string;
  provider_preference_id: string | null;
  provider_payment_id: string | null;
  external_reference: string;
  amount: number;
  currency: string;
  status: string;
  checkout_url: string | null;
  init_point: string | null;
  sandbox_init_point: string | null;
  expires_at: string | null;
  raw_provider_response: unknown;
};

function nowIso() {
  return new Date().toISOString();
}

function mapMercadoPagoStatus(status: string | null | undefined) {
  switch (status) {
    case "approved":
      return "paid";
    case "in_process":
    case "pending":
      return "payment_pending";
    case "rejected":
    case "cancelled":
    case "charged_back":
      return "rejected";
    default:
      return "manual_review";
  }
}

function buildReturnUrl(kind: "success" | "pending" | "failure", externalReference: string) {
  const url = new URL(`${getBaseUrl()}/payment/${kind}`);
  url.searchParams.set("external_reference", externalReference);
  return url.toString();
}

export async function getParticipationForProfile(profileId: string) {
  const service = createServiceRoleSupabaseClient();
  const { data, error } = await service
    .from("participations")
    .select("id, profile_id, payment_status, entry_price, entry_baseline_points")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as ParticipationRow | null;
}

export async function createMercadoPagoCheckoutForParticipation(input: {
  profileId: string;
  email: string | null;
}) {
  const participation = await getParticipationForProfile(input.profileId);

  if (!participation) {
    throw new Error("missing_participation");
  }

  if (participation.payment_status === "paid") {
    throw new Error("already_paid");
  }

  const service = createServiceRoleSupabaseClient();
  const amount = entryConfig.initialPrice;
  const currency = entryConfig.currency;
  const externalReference = `soliprode:${participation.id}:${crypto.randomUUID()}`;
  const expiresAt = entryConfig.priceValidUntil;

  const { data: insertedAttempt, error: insertError } = await service
    .from("payment_attempts")
    .insert({
      participation_id: participation.id,
      profile_id: input.profileId,
      provider: "mercadopago",
      external_reference: externalReference,
      amount,
      currency,
      status: "created",
      expires_at: expiresAt,
    })
    .select(
      "id, participation_id, profile_id, provider, provider_preference_id, provider_payment_id, external_reference, amount, currency, status, checkout_url, init_point, sandbox_init_point, expires_at, raw_provider_response",
    )
    .single();

  if (insertError || !insertedAttempt) {
    throw insertError ?? new Error("payment_attempt_insert_failed");
  }

  const preference = await createMercadoPagoPreference({
    items: [
      {
        title: "SoliProde - Inscripción inicial",
        quantity: 1,
        currency_id: currency,
        unit_price: amount,
      },
    ],
    payer: {
      email: input.email,
    },
    external_reference: externalReference,
    back_urls: {
      success: buildReturnUrl("success", externalReference),
      pending: buildReturnUrl("pending", externalReference),
      failure: buildReturnUrl("failure", externalReference),
    },
    notification_url: getMercadoPagoNotificationUrl(),
    auto_return: "approved",
  });

  const checkoutUrl = resolveMercadoPagoCheckoutUrl(preference);

  const { data: updatedAttempt, error: updateAttemptError } = await service
    .from("payment_attempts")
    .update({
      provider_preference_id: preference.id,
      checkout_url: checkoutUrl,
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point,
      status: "payment_started",
      raw_provider_response: preference,
    })
    .eq("id", insertedAttempt.id)
    .select(
      "id, participation_id, profile_id, provider, provider_preference_id, provider_payment_id, external_reference, amount, currency, status, checkout_url, init_point, sandbox_init_point, expires_at, raw_provider_response",
    )
    .single();

  if (updateAttemptError || !updatedAttempt) {
    throw updateAttemptError ?? new Error("payment_attempt_update_failed");
  }

  await service
    .from("participations")
    .update({
      payment_status: "payment_started",
      payment_provider: "mercadopago",
    })
    .eq("id", participation.id);

  return {
    participation,
    paymentAttempt: updatedAttempt as PaymentAttemptRow,
    checkoutUrl,
  };
}

async function applyAttemptAndParticipationState(
  attempt: PaymentAttemptRow,
  paymentInfo: MercadoPagoPaymentInfo | null,
) {
  const service = createServiceRoleSupabaseClient();

  if (!paymentInfo) {
    return {
      attemptStatus: attempt.status,
      participationStatus: null as string | null,
      approved: false,
    };
  }

  const nextAttemptStatus = mapMercadoPagoStatus(paymentInfo.status);
  const amountMatches = Number(paymentInfo.transaction_amount) === Number(attempt.amount);
  const externalReferenceMatches = paymentInfo.external_reference === attempt.external_reference;

  const safeAttemptStatus =
    amountMatches && externalReferenceMatches ? nextAttemptStatus : "manual_review";

  await service
    .from("payment_attempts")
    .update({
      provider_payment_id: String(paymentInfo.id),
      status: safeAttemptStatus,
      raw_provider_response: paymentInfo,
    })
    .eq("id", attempt.id);

  if (safeAttemptStatus === "paid") {
    await service
      .from("participations")
      .update({
        payment_status: "paid",
        payment_provider: "mercadopago",
        paid_at: nowIso(),
        activated_at: nowIso(),
        entry_price: attempt.amount,
        price_snapshot_at: nowIso(),
        price_valid_until: attempt.expires_at,
        eligible_from: nowIso(),
        entry_baseline_points: 0,
      })
      .eq("id", attempt.participation_id);

    return {
      attemptStatus: safeAttemptStatus,
      participationStatus: "paid",
      approved: true,
    };
  }

  const participationStatus =
    safeAttemptStatus === "payment_pending"
      ? "payment_pending"
      : safeAttemptStatus === "rejected"
        ? "rejected"
        : safeAttemptStatus === "manual_review"
          ? "manual_review"
          : attempt.status;

  if (participationStatus !== "paid") {
    await service
      .from("participations")
      .update({
        payment_status: participationStatus,
        payment_provider: "mercadopago",
      })
      .eq("id", attempt.participation_id);
  }

  return {
    attemptStatus: safeAttemptStatus,
    participationStatus,
    approved: false,
  };
}

export async function syncPaymentAttemptFromExternalReference(externalReference: string) {
  const attempt = await getPaymentAttemptByExternalReference(externalReference);

  if (!attempt) {
    return null;
  }

  let paymentInfo: MercadoPagoPaymentInfo | null = null;

  if (attempt.provider_payment_id) {
    paymentInfo = await getMercadoPagoPayment(attempt.provider_payment_id);
  } else {
    paymentInfo = await searchMercadoPagoPaymentByExternalReference(externalReference);
  }

  const syncResult = await applyAttemptAndParticipationState(
    attempt as PaymentAttemptRow,
    paymentInfo,
  );

  return {
    attempt: attempt as PaymentAttemptRow,
    paymentInfo,
    syncResult,
  };
}

export async function syncPaymentAttemptFromPaymentId(paymentId: string | number) {
  const paymentInfo = await getMercadoPagoPayment(paymentId);
  const externalReference = paymentInfo.external_reference;

  if (!externalReference) {
    return null;
  }

  return syncPaymentAttemptFromExternalReference(externalReference);
}

export async function getPaymentAttemptByExternalReference(externalReference: string) {
  const service = createServiceRoleSupabaseClient();
  const { data, error } = await service
    .from("payment_attempts")
    .select(
      "id, participation_id, profile_id, provider, provider_preference_id, provider_payment_id, external_reference, amount, currency, status, checkout_url, init_point, sandbox_init_point, expires_at, raw_provider_response",
    )
    .eq("external_reference", externalReference)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as PaymentAttemptRow | null) ?? null;
}
