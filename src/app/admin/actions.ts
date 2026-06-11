"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/access";
import {
  buildBrevoBatchError,
  buildBrevoBatchNotice,
  sendManualRecoveryBrevoBatch,
} from "@/lib/admin/brevo";
import {
  MAX_MANUAL_RECOVERY_SEND_BATCH_SIZE,
  RETRYABLE_MANUAL_RECOVERY_PAYMENT_STATUSES,
  getDefaultManualRecoveryTemplateKey,
  isManualRecoveryTemplateKey,
  type ManualRecoveryRecipient,
  type ManualRecoveryTemplateKey,
} from "@/lib/admin/manual-recovery-email";
import { pickPrimaryParticipation } from "@/lib/participations/primary";
import { resolveManualEligibleFrom } from "@/lib/participations/eligibility";
import { publishMatchResultAndScore, rebuildGeneralRankings } from "@/lib/scoring/official-rankings";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

function readStrictNonNegativeInteger(rawValue: FormDataEntryValue | null) {
  if (typeof rawValue !== "string") {
    return null;
  }

  const trimmed = rawValue.trim();

  if (!/^\d+$/.test(trimmed)) {
    return null;
  }

  const parsed = Number(trimmed);

  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

type DraftProfileRow = {
  id: string;
  full_name: string | null;
  public_alias: string | null;
  email: string | null;
};

type DraftParticipationRow = {
  id: string;
  profile_id: string;
  group_id: string | null;
  promoter_id: string | null;
  payment_status: string;
  created_at: string;
};

type DraftPaymentAttemptRow = {
  id: string;
  participation_id: string;
  provider: string;
  status: string;
  created_at: string;
};

type DraftPromoterRefRow = {
  id: string;
  name: string;
  code: string;
};

type DraftGroupRefRow = {
  id: string;
  name: string;
};

function buildAdminRedirect(params: Record<string, string | null | undefined>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value.trim()) {
      searchParams.set(key, value);
    }
  }

  const queryString = searchParams.toString();
  redirect(queryString ? `/admin?${queryString}` : "/admin");
}

async function updateLatestPendingAttemptForParticipation(params: {
  participationId: string;
  nextStatus: "paid" | "rejected";
  approvedAt?: string | null;
}) {
  const supabase = createServiceRoleSupabaseClient();
  const { data: attemptRows, error: attemptError } = await supabase
    .from("payment_attempts")
    .select("id, raw_provider_response")
    .eq("participation_id", params.participationId)
    .in("status", ["created", "payment_started", "payment_pending", "manual_review"])
    .order("created_at", { ascending: false })
    .limit(1);

  if (attemptError) {
    throw attemptError;
  }

  const attempt = ((attemptRows ?? [])[0] as { id: string; raw_provider_response: unknown } | undefined) ?? null;

  if (!attempt) {
    return;
  }

  const nextRaw =
    typeof attempt.raw_provider_response === "object" && attempt.raw_provider_response
      ? {
          ...(attempt.raw_provider_response as Record<string, unknown>),
          admin_resolved_at: new Date().toISOString(),
          admin_resolution: params.nextStatus,
        }
      : {
          admin_resolved_at: new Date().toISOString(),
          admin_resolution: params.nextStatus,
        };

  const { error: updateAttemptError } = await supabase
    .from("payment_attempts")
    .update({
      status: params.nextStatus,
      approved_at: params.approvedAt ?? null,
      raw_provider_response: nextRaw,
    })
    .eq("id", attempt.id);

  if (updateAttemptError) {
    throw updateAttemptError;
  }
}

export async function confirmParticipationAction(formData: FormData) {
  await requireAdminUser();

  const participationId = String(formData.get("participation_id") ?? "").trim();

  if (!participationId) {
    throw new Error("Missing participation_id");
  }

  const supabase = createServiceRoleSupabaseClient();
  const now = new Date().toISOString();
  const { data: participation, error: participationError } = await supabase
    .from("participations")
    .select("id, payment_started_at, payment_submitted_at")
    .eq("id", participationId)
    .maybeSingle();

  if (participationError || !participation) {
    throw new Error("No pudimos encontrar la participación a confirmar.");
  }

  const activatedAt = now;
  const eligibleFrom = resolveManualEligibleFrom(
    {
      payment_submitted_at: participation.payment_submitted_at,
      payment_started_at: participation.payment_started_at,
      activated_at: activatedAt,
    },
    now,
  );

  const { error } = await supabase
    .from("participations")
    .update({
      payment_status: "paid",
      paid_at: now,
      activated_at: activatedAt,
      eligible_from: eligibleFrom,
    })
    .eq("id", participationId);

  if (error) {
    throw new Error("No pudimos confirmar la participación.");
  }

  await updateLatestPendingAttemptForParticipation({
    participationId,
    nextStatus: "paid",
    approvedAt: now,
  });

  await rebuildGeneralRankings();

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/groups");
  revalidatePath("/matches");
  revalidatePath("/rankings");
}

export async function rejectParticipationAction(formData: FormData) {
  await requireAdminUser();

  const participationId = String(formData.get("participation_id") ?? "").trim();

  if (!participationId) {
    throw new Error("Missing participation_id");
  }

  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase
    .from("participations")
    .update({
      payment_status: "rejected",
    })
    .eq("id", participationId)
    .neq("payment_status", "paid");

  if (error) {
    throw new Error("No pudimos rechazar la participación.");
  }

  await updateLatestPendingAttemptForParticipation({
    participationId,
    nextStatus: "rejected",
  });

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/groups");
  revalidatePath("/matches");
  revalidatePath("/rankings");
  revalidatePath("/activar-pase");
}

function readSelectedProfileIds(formData: FormData) {
  const rawValues = formData.getAll("profile_id");

  return [...new Set(rawValues.map((value) => String(value ?? "").trim()).filter(Boolean))];
}

function readTemplateKey(formData: FormData): ManualRecoveryTemplateKey {
  const rawTemplate = String(formData.get("template_key") ?? "").trim();
  return isManualRecoveryTemplateKey(rawTemplate) ? rawTemplate : getDefaultManualRecoveryTemplateKey();
}

async function resolveManualRecoveryRecipients(profileIds: string[]) {
  const service = createServiceRoleSupabaseClient();
  const [profilesResult, participationsResult, paymentAttemptsResult, promotersResult, groupsResult] = await Promise.all([
    service.from("profiles").select("id, full_name, public_alias, email").in("id", profileIds),
    service
      .from("participations")
      .select("id, profile_id, group_id, promoter_id, payment_status, created_at")
      .in("profile_id", profileIds)
      .order("created_at", { ascending: false }),
    service
      .from("payment_attempts")
      .select("id, participation_id, provider, status, created_at")
      .order("created_at", { ascending: false })
      .limit(1000),
    service.from("promoters").select("id, name, code"),
    service.from("groups").select("id, name"),
  ]);

  if (profilesResult.error || participationsResult.error || paymentAttemptsResult.error || promotersResult.error || groupsResult.error) {
    throw new Error("No pudimos cargar los datos necesarios para operar esta bandeja.");
  }

  const profiles = (profilesResult.data ?? []) as DraftProfileRow[];
  const participations = (participationsResult.data ?? []) as DraftParticipationRow[];
  const paymentAttempts = (paymentAttemptsResult.data ?? []) as DraftPaymentAttemptRow[];
  const promoters = (promotersResult.data ?? []) as DraftPromoterRefRow[];
  const groups = (groupsResult.data ?? []) as DraftGroupRefRow[];
  const promoterMap = new Map(promoters.map((promoter) => [promoter.id, promoter]));
  const groupMap = new Map(groups.map((group) => [group.id, group]));
  const participationsByProfile = new Map<string, DraftParticipationRow[]>();
  const paymentAttemptByParticipation = new Map<string, DraftPaymentAttemptRow>();

  for (const participation of participations) {
    const existing = participationsByProfile.get(participation.profile_id) ?? [];
    existing.push(participation);
    participationsByProfile.set(participation.profile_id, existing);
  }

  for (const attempt of paymentAttempts) {
    if (!paymentAttemptByParticipation.has(attempt.participation_id)) {
      paymentAttemptByParticipation.set(attempt.participation_id, attempt);
    }
  }

  return profiles.flatMap<ManualRecoveryRecipient>((profile) => {
    const participation =
      pickPrimaryParticipation(participationsByProfile.get(profile.id) ?? []).participation ?? null;
    const paymentStatus = participation?.payment_status ?? "pending";

    if (!RETRYABLE_MANUAL_RECOVERY_PAYMENT_STATUSES.has(paymentStatus)) {
      return [];
    }

    const promoter = participation?.promoter_id ? promoterMap.get(participation.promoter_id) ?? null : null;
    const group = participation?.group_id ? groupMap.get(participation.group_id) ?? null : null;
    const paymentAttempt = participation ? paymentAttemptByParticipation.get(participation.id) ?? null : null;

    return [
      {
        profileId: profile.id,
        participationId: participation?.id ?? null,
        paymentAttemptId: paymentAttempt?.id ?? null,
        email: profile.email?.trim() ?? "",
        fullName: profile.full_name,
        nickname: profile.public_alias,
        promoterLabel: promoter ? `${promoter.name} (${promoter.code})` : null,
        groupLabel: group?.name ?? null,
        paymentStatus,
        paymentAttemptStatus: paymentAttempt?.status ?? null,
        paymentAttemptProvider: paymentAttempt?.provider ?? null,
      },
    ];
  });
}

export async function sendBrevoRecoveryEmailsAction(formData: FormData) {
  const adminUser = await requireAdminUser();
  const profileIds = readSelectedProfileIds(formData);
  const templateKey = readTemplateKey(formData);
  const confirmSend = String(formData.get("confirm_brevo_send") ?? "").trim();

  if (profileIds.length === 0) {
    buildAdminRedirect({
      send_error: "Seleccioná al menos un usuario para enviar la tanda.",
    });
  }

  if (confirmSend !== "yes") {
    buildAdminRedirect({
      send_error: "Confirmá la tanda antes de enviar con Brevo.",
    });
  }

  if (profileIds.length > MAX_MANUAL_RECOVERY_SEND_BATCH_SIZE) {
    buildAdminRedirect({
      send_error: `La selección supera el máximo de ${MAX_MANUAL_RECOVERY_SEND_BATCH_SIZE} correos por tanda.`,
    });
  }

  try {
    const recipients = await resolveManualRecoveryRecipients(profileIds);

    if (recipients.length === 0) {
      buildAdminRedirect({
        send_error: "Los usuarios seleccionados no están en estados reintentables para este flujo.",
      });
    }

    if (recipients.length > MAX_MANUAL_RECOVERY_SEND_BATCH_SIZE) {
      buildAdminRedirect({
        send_error: `La tanda elegible supera el máximo de ${MAX_MANUAL_RECOVERY_SEND_BATCH_SIZE} correos.`,
      });
    }

    const result = await sendManualRecoveryBrevoBatch({
      adminProfileId: adminUser.user.id,
      templateKey,
      recipients,
    });

    revalidatePath("/admin");
    buildAdminRedirect({
      send_notice: buildBrevoBatchNotice(result),
      send_error: buildBrevoBatchError(result),
    });
  } catch (error) {
    buildAdminRedirect({
      send_error: error instanceof Error ? error.message : "No pudimos enviar la tanda con Brevo.",
    });
  }
}

export async function publishMatchResultAction(formData: FormData) {
  await requireAdminUser();

  const matchId = String(formData.get("match_id") ?? "").trim();
  const scoreHome = readStrictNonNegativeInteger(formData.get("score_home"));
  const scoreAway = readStrictNonNegativeInteger(formData.get("score_away"));

  if (!matchId || scoreHome === null || scoreAway === null) {
    throw new Error("Resultado inválido.");
  }

  await publishMatchResultAndScore({
    matchId,
    scoreHome,
    scoreAway,
  });

  revalidatePath("/admin");
  revalidatePath("/groups");
  revalidatePath("/matches");
  revalidatePath("/rankings");
  revalidatePath("/dashboard");
}
