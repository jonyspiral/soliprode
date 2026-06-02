"use server";

import { revalidatePath } from "next/cache";
import { resolveManualEligibleFrom } from "@/lib/participations/eligibility";
import { publishMatchResultAndScore, rebuildGeneralRankings } from "@/lib/scoring/official-rankings";
import {
  createServerSupabaseClient,
  createServiceRoleSupabaseClient,
} from "@/lib/supabase/server";

async function ensureAdminAccess() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Necesitás iniciar sesión para usar el panel admin.");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || profile?.role !== "admin") {
    throw new Error("Solo un admin puede ejecutar esta acción.");
  }
}

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

export async function confirmParticipationAction(formData: FormData) {
  await ensureAdminAccess();

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

  await rebuildGeneralRankings();

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/groups");
  revalidatePath("/matches");
  revalidatePath("/rankings");
}

export async function publishMatchResultAction(formData: FormData) {
  await ensureAdminAccess();

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
