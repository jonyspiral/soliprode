import { entryConfig } from "@/lib/product/entry-config";
import { syncCaptainBonusStateForGroup } from "@/lib/captain-bonus/service";
import { resolveOnlineEligibleFrom } from "@/lib/participations/eligibility";
import { pickPrimaryParticipation } from "@/lib/participations/primary";
import { rebuildGeneralRankings } from "@/lib/scoring/official-rankings";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import {
  assertTeamPassPurchaseAccess,
  buildTeamPassAmount,
  finalizeApprovedTeamPassPurchase,
} from "@/lib/team-passes/service";
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
  group_id: string | null;
  payment_status: string;
  entry_price: number | null;
  entry_baseline_points: number | null;
  payment_started_at: string | null;
  payment_submitted_at: string | null;
  created_at: string;
};

type PaymentAttemptRow = {
  approved_at: string | null;
  checkout_kind: "individual_pass" | "team_pass";
  created_at?: string;
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
  target_group_id: string | null;
  team_slots_quantity: number;
  expires_at: string | null;
  raw_provider_response: unknown;
};

export type PaymentAttemptLookup = PaymentAttemptRow;

type PaidCheckoutGuard = {
  blockingAttempt: PaymentAttemptRow | null;
  paidParticipations: ParticipationRow[];
};

const PAYMENT_ATTEMPT_SELECT =
  "id, participation_id, profile_id, provider, provider_preference_id, provider_payment_id, external_reference, amount, currency, status, checkout_url, init_point, sandbox_init_point, expires_at, approved_at, raw_provider_response, created_at, checkout_kind, team_slots_quantity, target_group_id";

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
  const url = new URL(`${getBaseUrl()}/pago/${kind}`);
  url.searchParams.set("external_reference", externalReference);
  return url.toString();
}

function isAttemptStillUsable(attempt: PaymentAttemptRow) {
  if (!attempt.checkout_url) {
    return false;
  }

  if (!["created", "payment_started", "payment_pending", "manual_review"].includes(attempt.status)) {
    return false;
  }

  if (!attempt.expires_at) {
    return true;
  }

  return new Date(attempt.expires_at).getTime() > Date.now();
}

function buildCheckoutItemTitle(checkoutKind: "individual_pass" | "team_pass") {
  return checkoutKind === "team_pass" ? "Pase de equipo SoliProde" : "Pase Solidario SoliProde";
}

function normalizeCheckoutKind(value: unknown): "individual_pass" | "team_pass" {
  return value === "team_pass" ? "team_pass" : "individual_pass";
}

function normalizeTeamSlotsQuantity(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(1, Math.round(value));
  }

  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    return Math.max(1, Number(value.trim()));
  }

  return 1;
}

function normalizeTargetGroupId(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function buildAttemptRawProviderResponse(
  providerPayload: unknown,
  metadata: {
    checkoutKind: "individual_pass" | "team_pass";
    teamSlotsQuantity: number;
    targetGroupId: string | null;
  },
) {
  const payload =
    providerPayload && typeof providerPayload === "object" && !Array.isArray(providerPayload)
      ? { ...(providerPayload as Record<string, unknown>) }
      : {};
  const existingSoliprode =
    payload.soliprode && typeof payload.soliprode === "object" && !Array.isArray(payload.soliprode)
      ? (payload.soliprode as Record<string, unknown>)
      : {};

  return {
    ...payload,
    soliprode: {
      ...existingSoliprode,
      checkout_kind: metadata.checkoutKind,
      team_slots_quantity: metadata.teamSlotsQuantity,
      target_group_id: metadata.targetGroupId,
    },
  };
}

function readAttemptMetadata(attempt: PaymentAttemptRow): {
  checkoutKind: "individual_pass" | "team_pass";
  teamSlotsQuantity: number;
  targetGroupId: string | null;
} {
  const raw =
    attempt.raw_provider_response && typeof attempt.raw_provider_response === "object"
      ? (attempt.raw_provider_response as Record<string, unknown>)
      : null;
  const soliprode =
    raw?.soliprode && typeof raw.soliprode === "object"
      ? (raw.soliprode as Record<string, unknown>)
      : null;
  const checkoutKind = normalizeCheckoutKind(attempt.checkout_kind ?? soliprode?.checkout_kind);
  const teamSlotsQuantity = normalizeTeamSlotsQuantity(attempt.team_slots_quantity ?? soliprode?.team_slots_quantity);
  const targetGroupId = normalizeTargetGroupId(attempt.target_group_id ?? soliprode?.target_group_id);

  return {
    checkoutKind,
    teamSlotsQuantity,
    targetGroupId,
  };
}

export function getCheckoutKindForAttempt(attempt: PaymentAttemptLookup | PaymentAttemptRow) {
  return readAttemptMetadata(attempt as PaymentAttemptRow).checkoutKind;
}

export async function getParticipationForProfile(profileId: string) {
  const service = createServiceRoleSupabaseClient();
  const { data, error } = await service
    .from("participations")
    .select(
      "id, profile_id, group_id, payment_status, entry_price, entry_baseline_points, payment_started_at, payment_submitted_at, activated_at, created_at",
    )
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    throw error;
  }

  return pickPrimaryParticipation((data ?? []) as ParticipationRow[]).participation;
}

async function getPaidCheckoutGuard(profileId: string): Promise<PaidCheckoutGuard> {
  const service = createServiceRoleSupabaseClient();
  const [{ data: participationRows, error: participationError }, { data: attemptRows, error: attemptError }] =
    await Promise.all([
      service
        .from("participations")
        .select(
          "id, profile_id, group_id, payment_status, entry_price, entry_baseline_points, payment_started_at, payment_submitted_at, activated_at, created_at",
        )
        .eq("profile_id", profileId)
        .eq("payment_status", "paid")
        .order("created_at", { ascending: false }),
      service
        .from("payment_attempts")
        .select(PAYMENT_ATTEMPT_SELECT)
        .eq("profile_id", profileId)
        .or("status.eq.paid,approved_at.not.is.null")
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

  if (participationError) {
    throw participationError;
  }

  if (attemptError) {
    throw attemptError;
  }

  return {
    paidParticipations: (participationRows ?? []) as ParticipationRow[],
    blockingAttempt: ((attemptRows ?? [])[0] as PaymentAttemptRow | undefined) ?? null,
  };
}

export async function createMercadoPagoCheckoutForParticipation(input: {
  profileId: string;
  email: string | null;
}) {
  const paidCheckoutGuard = await getPaidCheckoutGuard(input.profileId);

  if (paidCheckoutGuard.paidParticipations.length > 0 || paidCheckoutGuard.blockingAttempt) {
    throw new Error("already_paid");
  }

  const participation = await getParticipationForProfile(input.profileId);

  if (!participation) {
    throw new Error("missing_participation");
  }

  if (participation.payment_status === "paid") {
    throw new Error("already_paid");
  }

  const service = createServiceRoleSupabaseClient();

  if (["payment_started", "payment_pending", "manual_review"].includes(participation.payment_status)) {
    const syncedAttempt = await syncPendingPaymentAttemptsForParticipation(participation.id);

    if (syncedAttempt?.syncResult.approved) {
      throw new Error("already_paid");
    }

    if (syncedAttempt?.attempt && isAttemptStillUsable(syncedAttempt.attempt)) {
      return {
        participation,
        paymentAttempt: syncedAttempt.attempt,
        checkoutUrl: syncedAttempt.attempt.checkout_url,
      };
    }
  }

  const amount = entryConfig.initialPrice;
  const persistedEntryPrice = participation.entry_price ?? amount;
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
      amount: persistedEntryPrice,
      currency,
      checkout_kind: "individual_pass",
      status: "created",
      team_slots_quantity: 1,
      expires_at: expiresAt,
      raw_provider_response: buildAttemptRawProviderResponse(null, {
        checkoutKind: "individual_pass",
        teamSlotsQuantity: 1,
        targetGroupId: null,
      }),
    })
    .select(PAYMENT_ATTEMPT_SELECT)
    .single();

  if (insertError || !insertedAttempt) {
    throw insertError ?? new Error("payment_attempt_insert_failed");
  }

  const preference = await createMercadoPagoPreference({
    items: [
      {
        title: "Pase Solidario SoliProde",
        quantity: 1,
        currency_id: currency,
        unit_price: persistedEntryPrice,
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
      raw_provider_response: buildAttemptRawProviderResponse(preference, {
        checkoutKind: "individual_pass",
        teamSlotsQuantity: 1,
        targetGroupId: null,
      }),
    })
    .eq("id", insertedAttempt.id)
    .select(PAYMENT_ATTEMPT_SELECT)
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
      entry_price: persistedEntryPrice,
      price_valid_until: expiresAt,
    })
    .eq("id", participation.id);

  return {
    participation: {
      ...participation,
      entry_price: persistedEntryPrice,
    },
    paymentAttempt: updatedAttempt as PaymentAttemptRow,
    checkoutUrl,
  };
}

export async function createMercadoPagoCheckoutForTeamPass(input: {
  profileId: string;
  email: string | null;
  teamId: string;
  slotQuantity: number;
}) {
  const { group, participation } = await assertTeamPassPurchaseAccess({
    profileId: input.profileId,
    teamId: input.teamId,
    slotQuantity: input.slotQuantity,
  });
  const service = createServiceRoleSupabaseClient();

  const { data: existingAttemptRows, error: existingAttemptError } = await service
    .from("payment_attempts")
    .select(PAYMENT_ATTEMPT_SELECT)
    .eq("profile_id", input.profileId)
    .eq("provider", "mercadopago")
    .in("status", ["created", "payment_started", "payment_pending", "manual_review"])
    .order("created_at", { ascending: false })
    .limit(10);

  if (existingAttemptError) {
    throw existingAttemptError;
  }

  const existingAttempt =
    ((existingAttemptRows ?? []) as PaymentAttemptRow[]).find((attempt) => {
      const metadata = readAttemptMetadata(attempt);
      return (
        metadata.checkoutKind === "team_pass" &&
        metadata.targetGroupId === group.id &&
        metadata.teamSlotsQuantity === input.slotQuantity
      );
    }) ?? null;

  if (existingAttempt && isAttemptStillUsable(existingAttempt)) {
    return {
      participation,
      paymentAttempt: existingAttempt,
      checkoutUrl: existingAttempt.checkout_url,
    };
  }

  const amount = await buildTeamPassAmount(input.slotQuantity);
  const currency = entryConfig.currency;
  const externalReference = `team-pass:${group.id}:${participation.id}:${crypto.randomUUID()}`;
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
      checkout_kind: "team_pass",
      status: "created",
      team_slots_quantity: input.slotQuantity,
      target_group_id: group.id,
      expires_at: expiresAt,
      raw_provider_response: buildAttemptRawProviderResponse(null, {
        checkoutKind: "team_pass",
        targetGroupId: group.id,
        teamSlotsQuantity: input.slotQuantity,
      }),
    })
    .select(PAYMENT_ATTEMPT_SELECT)
    .single();

  if (insertError || !insertedAttempt) {
    throw insertError ?? new Error("payment_attempt_insert_failed");
  }

  const preference = await createMercadoPagoPreference({
    items: [
      {
        title: buildCheckoutItemTitle("team_pass"),
        quantity: input.slotQuantity,
        currency_id: currency,
        unit_price: entryConfig.initialPrice,
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
      checkout_kind: "team_pass",
      team_slots_quantity: input.slotQuantity,
      target_group_id: group.id,
      raw_provider_response: buildAttemptRawProviderResponse(preference, {
        checkoutKind: "team_pass",
        targetGroupId: group.id,
        teamSlotsQuantity: input.slotQuantity,
      }),
    })
    .eq("id", insertedAttempt.id)
    .select(PAYMENT_ATTEMPT_SELECT)
    .single();

  if (updateAttemptError || !updatedAttempt) {
    throw updateAttemptError ?? new Error("payment_attempt_update_failed");
  }

  return {
    participation,
    paymentAttempt: updatedAttempt as PaymentAttemptRow,
    checkoutUrl,
  };
}

export async function createBankTransferManualReviewForParticipation(input: {
  profileId: string;
  source?: string;
}) {
  const paidCheckoutGuard = await getPaidCheckoutGuard(input.profileId);

  if (paidCheckoutGuard.paidParticipations.length > 0 || paidCheckoutGuard.blockingAttempt) {
    throw new Error("already_paid");
  }

  const participation = await getParticipationForProfile(input.profileId);

  if (!participation) {
    throw new Error("missing_participation");
  }

  if (participation.payment_status === "paid") {
    throw new Error("already_paid");
  }

  const service = createServiceRoleSupabaseClient();
  const now = nowIso();
  const amount = participation.entry_price ?? entryConfig.initialPrice;
  const externalReference = `transfer:${participation.id}:${crypto.randomUUID()}`;

  const { data: existingAttemptRows, error: existingAttemptError } = await service
    .from("payment_attempts")
    .select(PAYMENT_ATTEMPT_SELECT)
    .eq("participation_id", participation.id)
    .eq("provider", "bank_transfer")
    .in("status", ["created", "manual_review", "payment_pending"])
    .order("created_at", { ascending: false })
    .limit(1);

  if (existingAttemptError) {
    throw existingAttemptError;
  }

  const existingAttempt = ((existingAttemptRows ?? [])[0] as PaymentAttemptRow | undefined) ?? null;

  if (existingAttempt) {
    const nextRaw =
      typeof existingAttempt.raw_provider_response === "object" && existingAttempt.raw_provider_response
        ? {
            ...(existingAttempt.raw_provider_response as Record<string, unknown>),
            last_declared_at: now,
            source: input.source ?? "activar-pase",
          }
        : {
            declared_at: now,
            last_declared_at: now,
            source: input.source ?? "activar-pase",
          };

    const { data: updatedAttempt, error: updateAttemptError } = await service
      .from("payment_attempts")
      .update({
        amount,
        currency: entryConfig.currency,
        status: "manual_review",
        raw_provider_response: nextRaw,
      })
      .eq("id", existingAttempt.id)
      .select(PAYMENT_ATTEMPT_SELECT)
      .single();

    if (updateAttemptError || !updatedAttempt) {
      throw updateAttemptError ?? new Error("payment_attempt_update_failed");
    }

    await service
      .from("participations")
      .update({
        payment_status: "manual_review",
        payment_provider: "bank_transfer",
        payment_started_at: participation.payment_started_at ?? now,
        payment_submitted_at: now,
        entry_price: amount,
        price_valid_until: entryConfig.priceValidUntil,
      })
      .eq("id", participation.id);

    return {
      participation: {
        ...participation,
        entry_price: amount,
      },
      paymentAttempt: updatedAttempt as PaymentAttemptRow,
    };
  }

  const { data: insertedAttempt, error: insertError } = await service
    .from("payment_attempts")
    .insert({
      participation_id: participation.id,
      profile_id: input.profileId,
      provider: "bank_transfer",
      external_reference: externalReference,
      amount,
      currency: entryConfig.currency,
      status: "manual_review",
      raw_provider_response: {
        declared_at: now,
        last_declared_at: now,
        source: input.source ?? "activar-pase",
      },
    })
    .select(PAYMENT_ATTEMPT_SELECT)
    .single();

  if (insertError || !insertedAttempt) {
    throw insertError ?? new Error("payment_attempt_insert_failed");
  }

  await service
    .from("participations")
    .update({
      payment_status: "manual_review",
      payment_provider: "bank_transfer",
      payment_started_at: participation.payment_started_at ?? now,
      payment_submitted_at: now,
      entry_price: amount,
      price_valid_until: entryConfig.priceValidUntil,
    })
    .eq("id", participation.id);

  return {
    participation: {
      ...participation,
      entry_price: amount,
    },
    paymentAttempt: insertedAttempt as PaymentAttemptRow,
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
  const amountMatchesAttempt = Number(paymentInfo.transaction_amount) === Number(attempt.amount);
  const externalReferenceMatches = paymentInfo.external_reference === attempt.external_reference;
  const approvedAt = normalizeProviderApprovedAt(paymentInfo.approved_at);

  let safeAttemptStatus = externalReferenceMatches ? nextAttemptStatus : "manual_review";

  const { data: participationRows, error: participationError } = await service
    .from("participations")
    .select(
      "id, group_id, payment_status, entry_price, payment_started_at, payment_submitted_at, activated_at, created_at",
    )
    .eq("id", attempt.participation_id)
    .limit(1);

  if (participationError) {
    throw participationError;
  }

  const participation = ((participationRows ?? [])[0] as Pick<
    ParticipationRow,
    | "id"
    | "group_id"
    | "payment_status"
    | "entry_price"
    | "payment_started_at"
    | "payment_submitted_at"
    | "activated_at"
    | "created_at"
  > | undefined) ?? null;
  const participationAmount =
    typeof participation?.entry_price === "number" ? participation.entry_price : Number(participation?.entry_price ?? 0);
  const amountMatchesParticipation =
    Number.isFinite(participationAmount) && participationAmount > 0
      ? Number(paymentInfo.transaction_amount) === participationAmount
      : amountMatchesAttempt;

  if (!amountMatchesParticipation) {
    safeAttemptStatus = "manual_review";
  }

  const metadata = readAttemptMetadata(attempt);

  await service
    .from("payment_attempts")
    .update({
      approved_at: approvedAt,
      provider_payment_id: String(paymentInfo.id),
      status: safeAttemptStatus,
      raw_provider_response: buildAttemptRawProviderResponse(paymentInfo, metadata),
    })
    .eq("id", attempt.id);

  if (safeAttemptStatus === "paid") {
    if (metadata.checkoutKind === "team_pass") {
      if (!metadata.targetGroupId) {
        throw new Error("team_pass_missing_group");
      }

      await finalizeApprovedTeamPassPurchase({
        paymentAttemptId: attempt.id,
        profileId: attempt.profile_id,
        teamId: metadata.targetGroupId,
        slotQuantity: metadata.teamSlotsQuantity,
        expiresAt: attempt.expires_at ?? null,
      });

      return {
        attemptStatus: safeAttemptStatus,
        participationStatus: participation?.payment_status ?? "paid",
        approved: true,
      };
    }

    if (participation?.payment_status === "paid") {
      return {
        attemptStatus: safeAttemptStatus,
        participationStatus: "paid",
        approved: true,
      };
    }

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

    if (participation?.group_id) {
      await syncCaptainBonusStateForGroup(participation.group_id);
    }

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

  if (participationStatus !== "paid" && participation?.payment_status !== "paid") {
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

async function getPaymentInfoForAttempt(attempt: PaymentAttemptRow) {
  if (attempt.provider_payment_id) {
    return getMercadoPagoPayment(attempt.provider_payment_id);
  }

  return searchMercadoPagoPaymentByExternalReference(attempt.external_reference);
}

function isApprovedPaymentForAttempt(
  attempt: PaymentAttemptRow,
  paymentInfo: MercadoPagoPaymentInfo | null,
) {
  if (!paymentInfo) {
    return false;
  }

  return (
    mapMercadoPagoStatus(paymentInfo.status) === "paid" &&
    Number(paymentInfo.transaction_amount) === Number(attempt.amount) &&
    paymentInfo.external_reference === attempt.external_reference
  );
}

export async function syncPendingPaymentAttemptsForParticipation(participationId: string) {
  const service = createServiceRoleSupabaseClient();
  const { data, error } = await service
    .from("payment_attempts")
    .select(PAYMENT_ATTEMPT_SELECT)
    .eq("participation_id", participationId)
    .eq("provider", "mercadopago")
    .in("status", ["created", "payment_started", "payment_pending", "manual_review"])
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    throw error;
  }

  const attempts = ((data ?? []) as PaymentAttemptRow[]) ?? [];

  if (attempts.length === 0) {
    return null;
  }

  let latestPaymentInfo: MercadoPagoPaymentInfo | null | undefined;

  for (const attempt of attempts) {
    const paymentInfo = await getPaymentInfoForAttempt(attempt);

    if (attempt.id === attempts[0]?.id) {
      latestPaymentInfo = paymentInfo;
    }

    if (isApprovedPaymentForAttempt(attempt, paymentInfo)) {
      const syncResult = await applyAttemptAndParticipationState(attempt, paymentInfo);

      return {
        attempt,
        paymentInfo,
        syncResult,
      };
    }
  }

  const latestAttempt = attempts[0];
  const syncResult = await applyAttemptAndParticipationState(
    latestAttempt,
    latestPaymentInfo ?? null,
  );

  return {
    attempt: latestAttempt,
    paymentInfo: latestPaymentInfo ?? null,
    syncResult,
  };
}

export async function syncPaymentAttemptFromExternalReference(externalReference: string) {
  const attempt = await getPaymentAttemptByExternalReference(externalReference);

  if (!attempt) {
    return null;
  }

  const paymentInfo = await getPaymentInfoForAttempt(attempt as PaymentAttemptRow);

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
    .select(PAYMENT_ATTEMPT_SELECT)
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
    .select(PAYMENT_ATTEMPT_SELECT)
    .eq("external_reference", externalReference)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as PaymentAttemptRow | null) ?? null;
}
