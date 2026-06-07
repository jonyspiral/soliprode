"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/admin/access";
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
