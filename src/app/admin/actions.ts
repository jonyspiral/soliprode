"use server";

import { createHash, createHmac } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { requireAdminUser } from "@/lib/admin/access";
import {
  buildBrevoBatchError,
  buildBrevoBatchNotice,
  sendManualRecoveryBrevoTestEmail,
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
import {
  cancelCaptainBonusCampaign,
  createCaptainBonusCampaign,
  syncCaptainBonusStateForGroup,
} from "@/lib/captain-bonus/service";
import { pickPrimaryParticipation } from "@/lib/participations/primary";
import { resolveManualEligibleFrom } from "@/lib/participations/eligibility";
import {
  publishMatchResultAndScore,
  rebuildFinishedMatchScoresAndRankings,
  rebuildGeneralRankings,
} from "@/lib/scoring/official-rankings";
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

const MANUAL_RECOVERY_TEST_PROOF_WINDOW_MS = 30 * 60 * 1000;

function buildAdminRedirect(params: Record<string, string | null | undefined>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value.trim()) {
      searchParams.set(key, value);
    }
  }

  // Force a distinct URL for repeated admin actions so same-message redirects
  // still navigate and refresh notices on the current page.
  searchParams.set("admin_redirect_at", Date.now().toString());

  const queryString = searchParams.toString();
  redirect(queryString ? `/admin?${queryString}` : "/admin");
}

function normalizeSelectedProfileIds(profileIds: string[]) {
  return [...new Set(profileIds.map((value) => value.trim()).filter(Boolean))].sort();
}

function serializeSelectedProfileIds(profileIds: string[]) {
  return normalizeSelectedProfileIds(profileIds).join(",");
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function buildSelectionContextValue(profileIds: string[], templateKey: ManualRecoveryTemplateKey) {
  return encodeBase64Url(
    JSON.stringify({
      profileIds: normalizeSelectedProfileIds(profileIds),
      templateKey,
    }),
  );
}

function buildSelectionHash(profileIds: string[], templateKey: ManualRecoveryTemplateKey) {
  return createHash("sha256")
    .update(`${templateKey}:${normalizeSelectedProfileIds(profileIds).join(",")}`)
    .digest("hex");
}

function getManualRecoveryProofSecret() {
  const secret = process.env.BREVO_API_KEY?.trim();

  if (!secret) {
    throw new Error("Faltan BREVO_API_KEY, BREVO_SENDER_NAME o BREVO_SENDER_EMAIL.");
  }

  return secret;
}

function createManualRecoveryTestProof(params: {
  adminProfileId: string;
  adminEmail: string;
  profileIds: string[];
  templateKey: ManualRecoveryTemplateKey;
}) {
  const payload = {
    adminEmail: params.adminEmail.trim().toLowerCase(),
    adminProfileId: params.adminProfileId,
    selectionHash: buildSelectionHash(params.profileIds, params.templateKey),
    templateKey: params.templateKey,
    testedAt: Date.now(),
    v: 1,
  };
  const payloadValue = encodeBase64Url(JSON.stringify(payload));
  const signature = createHmac("sha256", getManualRecoveryProofSecret()).update(payloadValue).digest("base64url");

  return `${payloadValue}.${signature}`;
}

function verifyManualRecoveryTestProof(params: {
  token: string;
  adminProfileId: string;
  adminEmail: string;
  profileIds: string[];
  templateKey: ManualRecoveryTemplateKey;
}) {
  const [payloadValue, signature] = params.token.split(".");

  if (!payloadValue || !signature) {
    return false;
  }

  const expectedSignature = createHmac("sha256", getManualRecoveryProofSecret()).update(payloadValue).digest("base64url");

  if (signature !== expectedSignature) {
    return false;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(payloadValue)) as {
      adminEmail?: string;
      adminProfileId?: string;
      selectionHash?: string;
      templateKey?: string;
      testedAt?: number;
      v?: number;
    };

    if (payload.v !== 1) {
      return false;
    }

    if (payload.adminProfileId !== params.adminProfileId) {
      return false;
    }

    if (payload.adminEmail !== params.adminEmail.trim().toLowerCase()) {
      return false;
    }

    if (payload.templateKey !== params.templateKey) {
      return false;
    }

    if (payload.selectionHash !== buildSelectionHash(params.profileIds, params.templateKey)) {
      return false;
    }

    if (
      typeof payload.testedAt !== "number" ||
      !Number.isFinite(payload.testedAt) ||
      Date.now() - payload.testedAt > MANUAL_RECOVERY_TEST_PROOF_WINDOW_MS
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function buildManualRecoveryRedirectParams(params: {
  profileIds: string[];
  templateKey: ManualRecoveryTemplateKey;
  sendError?: string | null;
  sendNotice?: string | null;
  testError?: string | null;
  testNotice?: string | null;
  testContext?: string | null;
  testProof?: string | null;
}) {
  return {
    selected_profile_ids: serializeSelectedProfileIds(params.profileIds),
    template_key: params.templateKey,
    send_error: params.sendError ?? null,
    send_notice: params.sendNotice ?? null,
    test_error: params.testError ?? null,
    test_notice: params.testNotice ?? null,
    test_context: params.testContext ?? null,
    test_proof: params.testProof ?? null,
  };
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
    .select("id, group_id, payment_started_at, payment_submitted_at")
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

  await syncCaptainBonusStateForGroup(participation.group_id);
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

function readOptionalTextField(formData: FormData, key: string) {
  const rawValue = formData.get(key);
  if (typeof rawValue !== "string") {
    return null;
  }

  const trimmed = rawValue.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function createCaptainBonusInviteAction(formData: FormData) {
  const adminUser = await requireAdminUser();
  const campaignName = readOptionalTextField(formData, "campaign_name");
  const totalSlots = readStrictNonNegativeInteger(formData.get("total_slots"));
  const expiresAtRaw = readOptionalTextField(formData, "expires_at");

  if (!campaignName || campaignName.length < 3) {
    buildAdminRedirect({
      send_error: "El nombre de campaña necesita al menos 3 caracteres.",
    });
  }

  if (!totalSlots || totalSlots < 1) {
    buildAdminRedirect({
      send_error: "Indicá una cantidad válida de cupos.",
    });
  }

  let expiresAt: string | null = null;
  if (expiresAtRaw) {
    const parsed = new Date(expiresAtRaw);
    if (!Number.isFinite(parsed.getTime())) {
      buildAdminRedirect({
        send_error: "La fecha de vencimiento no es válida.",
      });
    }
    expiresAt = parsed.toISOString();
  }

  try {
    await createCaptainBonusCampaign({
      adminProfileId: adminUser.user.id,
      expiresAt,
      name: campaignName ?? "",
      notes: readOptionalTextField(formData, "notes"),
      totalSlots: totalSlots ?? 0,
    });

    revalidatePath("/admin");
    buildAdminRedirect({
      ranking_notice: "Campaña de Capitán Bonificado creada.",
    });
  } catch (error) {
    buildAdminRedirect({
      send_error: error instanceof Error ? error.message : "No pudimos crear la campaña de Capitán Bonificado.",
    });
  }
}

export async function revokeCaptainBonusInviteAction(formData: FormData) {
  await requireAdminUser();
  const campaignId = readOptionalTextField(formData, "campaign_id");

  if (!campaignId) {
    buildAdminRedirect({
      send_error: "Falta la campaña a cancelar.",
    });
  }

  try {
    await cancelCaptainBonusCampaign(campaignId ?? "");
    revalidatePath("/admin");
    buildAdminRedirect({
      ranking_notice: "Campaña de Capitán Bonificado cancelada.",
    });
  } catch (error) {
    buildAdminRedirect({
      send_error: error instanceof Error ? error.message : "No pudimos cancelar la campaña.",
    });
  }
}

function readSelectedProfileIds(formData: FormData) {
  const rawValues = formData.getAll("profile_id");

  return normalizeSelectedProfileIds(rawValues.map((value) => String(value ?? "").trim()));
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

export async function sendBrevoRecoveryTestAction(formData: FormData) {
  const adminUser = await requireAdminUser();
  const profileIds = readSelectedProfileIds(formData);
  const templateKey = readTemplateKey(formData);
  const adminEmail = adminUser.user.email?.trim() ?? null;

  if (profileIds.length === 0) {
    buildAdminRedirect(
      buildManualRecoveryRedirectParams({
        profileIds,
        templateKey,
        testError: "Seleccioná al menos un usuario para enviar la prueba.",
      }),
    );
  }

  if (profileIds.length > MAX_MANUAL_RECOVERY_SEND_BATCH_SIZE) {
    buildAdminRedirect(
      buildManualRecoveryRedirectParams({
        profileIds,
        templateKey,
        testError: `La selección supera el máximo de ${MAX_MANUAL_RECOVERY_SEND_BATCH_SIZE} correos por tanda.`,
      }),
    );
  }

  if (!adminEmail) {
    buildAdminRedirect(
      buildManualRecoveryRedirectParams({
        profileIds,
        templateKey,
        testError: "Tu usuario admin no tiene email disponible para recibir la prueba.",
      }),
    );
  }

  const safeAdminEmail = adminEmail || "";

  try {
    const recipients = await resolveManualRecoveryRecipients(profileIds);

    if (recipients.length === 0) {
      buildAdminRedirect(
        buildManualRecoveryRedirectParams({
          profileIds,
          templateKey,
          testError: "Los usuarios seleccionados no están en estados reintentables para este flujo.",
        }),
      );
    }

    const previewRecipient = recipients[0];
    await sendManualRecoveryBrevoTestEmail({
      recipient: previewRecipient,
      templateKey,
      adminEmail: safeAdminEmail,
      adminName: adminUser.profile.public_alias ?? safeAdminEmail,
    });

    buildAdminRedirect(
      buildManualRecoveryRedirectParams({
        profileIds,
        templateKey,
        testContext: buildSelectionContextValue(profileIds, templateKey),
        testProof: createManualRecoveryTestProof({
          adminProfileId: adminUser.user.id,
          adminEmail: safeAdminEmail,
          profileIds,
          templateKey,
        }),
        testNotice: `Prueba enviada a ${safeAdminEmail} usando la plantilla seleccionada.`,
      }),
    );
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    buildAdminRedirect(
      buildManualRecoveryRedirectParams({
        profileIds,
        templateKey,
        testError: error instanceof Error ? error.message : "No pudimos enviar la prueba con Brevo.",
      }),
    );
  }
}

export async function sendBrevoRecoveryEmailsAction(formData: FormData) {
  const adminUser = await requireAdminUser();
  const profileIds = readSelectedProfileIds(formData);
  const templateKey = readTemplateKey(formData);
  const confirmSend = String(formData.get("confirm_brevo_send") ?? "").trim();
  const testProof = String(formData.get("manual_recovery_test_proof") ?? "").trim();
  const adminEmail = adminUser.user.email?.trim() ?? null;

  if (profileIds.length === 0) {
    buildAdminRedirect(
      buildManualRecoveryRedirectParams({
        profileIds,
        templateKey,
        sendError: "Seleccioná al menos un usuario para enviar la tanda.",
      }),
    );
  }

  if (confirmSend !== "yes") {
    buildAdminRedirect(
      buildManualRecoveryRedirectParams({
        profileIds,
        templateKey,
        sendError: "Confirmá la tanda antes de enviar con Brevo.",
      }),
    );
  }

  if (profileIds.length > MAX_MANUAL_RECOVERY_SEND_BATCH_SIZE) {
    buildAdminRedirect(
      buildManualRecoveryRedirectParams({
        profileIds,
        templateKey,
        sendError: `La selección supera el máximo de ${MAX_MANUAL_RECOVERY_SEND_BATCH_SIZE} correos por tanda.`,
      }),
    );
  }

  if (!testProof || !adminEmail) {
    buildAdminRedirect(
      buildManualRecoveryRedirectParams({
        profileIds,
        templateKey,
        sendError: "Antes de enviar la tanda real, mandá una prueba a tu correo.",
      }),
    );
  }

  const safeAdminEmail = adminEmail || "";

  if (
    !verifyManualRecoveryTestProof({
      token: testProof,
      adminProfileId: adminUser.user.id,
      adminEmail: safeAdminEmail,
      profileIds,
      templateKey,
    })
  ) {
    buildAdminRedirect(
      buildManualRecoveryRedirectParams({
        profileIds,
        templateKey,
        sendError: "La prueba previa no coincide con esta selección o ya venció. Enviá una prueba nueva.",
      }),
    );
  }

  try {
    const recipients = await resolveManualRecoveryRecipients(profileIds);

    if (recipients.length === 0) {
      buildAdminRedirect(
        buildManualRecoveryRedirectParams({
          profileIds,
          templateKey,
          sendError: "Los usuarios seleccionados no están en estados reintentables para este flujo.",
        }),
      );
    }

    if (recipients.length > MAX_MANUAL_RECOVERY_SEND_BATCH_SIZE) {
      buildAdminRedirect(
        buildManualRecoveryRedirectParams({
          profileIds,
          templateKey,
          sendError: `La tanda elegible supera el máximo de ${MAX_MANUAL_RECOVERY_SEND_BATCH_SIZE} correos.`,
        }),
      );
    }

    const result = await sendManualRecoveryBrevoBatch({
      adminProfileId: adminUser.user.id,
      templateKey,
      recipients,
    });

    revalidatePath("/admin");
    buildAdminRedirect(
      buildManualRecoveryRedirectParams({
        profileIds: [],
        templateKey,
        sendNotice: buildBrevoBatchNotice(result),
        sendError: buildBrevoBatchError(result),
      }),
    );
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    buildAdminRedirect(
      buildManualRecoveryRedirectParams({
        profileIds,
        templateKey,
        sendError: error instanceof Error ? error.message : "No pudimos enviar la tanda con Brevo.",
      }),
    );
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

export async function rebuildRankingsAction() {
  await requireAdminUser();

  const summary = await rebuildFinishedMatchScoresAndRankings();

  revalidatePath("/admin");
  revalidatePath("/groups");
  revalidatePath("/matches");
  revalidatePath("/rankings");
  revalidatePath("/dashboard");

  buildAdminRedirect({
    ranking_notice:
      `Rebuild OK: ${summary.finishedMatchesProcessed} partido(s), ` +
      `${summary.predictionsProcessed} pronóstico(s), ` +
      `${summary.rankedPlayers} jugador(es) rankeado(s).`,
  });
}
