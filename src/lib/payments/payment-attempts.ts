import { entryConfig } from "@/lib/product/entry-config";
import { resolveOnlineEligibleFrom } from "@/lib/participations/eligibility";
import { pickPrimaryParticipation } from "@/lib/participations/primary";
import { rebuildGeneralRankings } from "@/lib/scoring/official-rankings";
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
  activated_at: string | null;
  id: string;
  profile_id: string;
  payment_status: string;
  entry_price: number | null;
  entry_baseline_points: number | null;
  payment_started_at: string | null;
  payment_submitted_at: string | null;
  created_at: string;
};

type PaymentAttemptRow = {
  approved_at: string | null;
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

export type PaymentAttemptLookup = PaymentAttemptRow;

function nowIso() {
  return new Date().toISOString();
}

function normalizeProviderApprovedAt(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
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
    .select(
      "id, profile_id, payment_status, entry_price, entry_baseline_points, payment_started_at, payment_submitted_at, activated_at, created_at",
    )
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(2);

  if (error) {
    throw error;
  }

  return pickPrimaryParticipation((data ?? []) as ParticipationRow[]).participation;
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
  const paymentStartedAt = participation.payment_started_at ?? nowIso();

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
      "id, participation_id, profile_id, provider, provider_preference_id, provider_payment_id, external_reference, amount, currency, status, checkout_url, init_point, sandbox_init_point, expires_at, approved_at, raw_provider_response",
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
      "id, participation_id, profile_id, provider, provider_preference_id, provider_payment_id, external_reference, amount, currency, status, checkout_url, init_point, sandbox_init_point, expires_at, approved_at, raw_provider_response",
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
      payment_started_at: paymentStartedAt,
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
  const approvedAt = normalizeProviderApprovedAt(paymentInfo.approved_at);

  const safeAttemptStatus =
    amountMatches && externalReferenceMatches ? nextAttemptStatus : "manual_review";

  const { data: participationRows, error: participationError } = await service
    .from("participations")
    .select("id, payment_started_at, payment_submitted_at, activated_at, created_at")
    .eq("id", attempt.participation_id)
    .limit(1);

  if (participationError) {
    throw participationError;
  }

  const participation = ((participationRows ?? [])[0] as Pick<
    ParticipationRow,
    "id" | "payment_started_at" | "payment_submitted_at" | "activated_at" | "created_at"
  > | undefined) ?? null;

  await service
    .from("payment_attempts")
    .update({
      approved_at: approvedAt,
      provider_payment_id: String(paymentInfo.id),
      status: safeAttemptStatus,
      raw_provider_response: paymentInfo,
    })
    .eq("id", attempt.id);

  if (safeAttemptStatus === "paid") {
    const paidAt = nowIso();
    const activatedAt = nowIso();
    const eligibleFrom = resolveOnlineEligibleFrom(
      {
        approved_at: approvedAt,
        payment_started_at: participation?.payment_started_at ?? null,
        activated_at: activatedAt,
        paid_at: paidAt,
      },
      paidAt,
    );

    await service
      .from("participations")
      .update({
        payment_status: "paid",
        payment_provider: "mercadopago",
        paid_at: paidAt,
        activated_at: activatedAt,
        entry_price: attempt.amount,
        price_snapshot_at: paidAt,
        price_valid_until: attempt.expires_at,
        eligible_from: eligibleFrom,
        entry_baseline_points: 0,
      })
      .eq("id", attempt.participation_id);

    await rebuildGeneralRankings();

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

export async function getPaymentAttemptByPreferenceId(preferenceId: string) {
  const service = createServiceRoleSupabaseClient();
  const { data, error } = await service
    .from("payment_attempts")
    .select(
      "id, participation_id, profile_id, provider, provider_preference_id, provider_payment_id, external_reference, amount, currency, status, checkout_url, init_point, sandbox_init_point, expires_at, approved_at, raw_provider_response",
    )
    .eq("provider_preference_id", preferenceId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as PaymentAttemptRow | null) ?? null;
}

export async function syncPaymentAttemptFromPreferenceId(preferenceId: string) {
  const attempt = await getPaymentAttemptByPreferenceId(preferenceId);

  if (!attempt) {
    return null;
  }

  return syncPaymentAttemptFromExternalReference(attempt.external_reference);
}

export async function getPaymentAttemptByExternalReference(externalReference: string) {
  const service = createServiceRoleSupabaseClient();
  const { data, error } = await service
    .from("payment_attempts")
    .select(
      "id, participation_id, profile_id, provider, provider_preference_id, provider_payment_id, external_reference, amount, currency, status, checkout_url, init_point, sandbox_init_point, expires_at, approved_at, raw_provider_response",
    )
    .eq("external_reference", externalReference)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as PaymentAttemptRow | null) ?? null;
}
