"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { withSupabaseTimeout } from "@/lib/supabase/timeouts";

type SavePredictionActionInput = {
  matchId: string;
  homeScore: number;
  awayScore: number;
};

type SavedPrediction = {
  id: string;
  match_id: string;
  predicted_home: number;
  predicted_away: number;
  locked_at: string | null;
  points: number;
};

export type SavePredictionActionResult =
  | {
      ok: true;
      prediction: SavedPrediction;
    }
  | {
      ok: false;
      error:
        | "UNAUTHENTICATED"
        | "INVALID_SCORE"
        | "PROFILE_MISSING"
        | "MATCH_NOT_FOUND"
        | "MATCH_NOT_READY"
        | "MATCH_CLOSED"
        | "UNKNOWN";
      message: string;
    };

function isStrictNonNegativeInteger(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && Number.isFinite(value) && value >= 0;
}

export async function savePredictionAction({
  matchId,
  homeScore,
  awayScore,
}: SavePredictionActionInput): Promise<SavePredictionActionResult> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await withSupabaseTimeout(supabase.auth.getUser(), "Supabase auth timed out");

  if (!user) {
    return {
      ok: false,
      error: "UNAUTHENTICATED",
      message: "Entrá con tu cuenta para guardar pronósticos.",
    };
  }

  if (!matchId.trim() || !isStrictNonNegativeInteger(homeScore) || !isStrictNonNegativeInteger(awayScore)) {
    return {
      ok: false,
      error: "INVALID_SCORE",
      message: "No pudimos guardar el pronóstico. Probá de nuevo.",
    };
  }

  const normalizedMatchId = matchId.trim();
  const nowIso = new Date().toISOString();

  const [{ data: profileRow, error: profileError }, { data: matchRow, error: matchError }] =
    await withSupabaseTimeout(
      Promise.all([
        supabase.from("profiles").select("id").eq("id", user.id).maybeSingle(),
        supabase
          .from("matches")
          .select("id, status, prediction_closes_at, home_team_id, away_team_id")
          .eq("id", normalizedMatchId)
          .maybeSingle(),
      ]),
      "Supabase prediction preflight timed out",
    );

  if (profileError) {
    console.error("[matches] profile preflight failed", {
      userId: user.id,
      matchId: normalizedMatchId,
      message: profileError.message,
      code: profileError.code,
      details: profileError.details,
      hint: profileError.hint,
    });
  }

  if (!profileRow) {
    console.error("[matches] profile missing during prediction save", {
      userId: user.id,
      matchId: normalizedMatchId,
      profileError: profileError
        ? {
            message: profileError.message,
            code: profileError.code,
            details: profileError.details,
            hint: profileError.hint,
          }
        : null,
    });

    return {
      ok: false,
      error: "PROFILE_MISSING",
      message: "No pudimos encontrar tu perfil de jugador. Cerrá sesión y volvé a entrar.",
    };
  }

  if (matchError) {
    console.error("[matches] match preflight failed", {
      userId: user.id,
      matchId: normalizedMatchId,
      message: matchError.message,
      code: matchError.code,
      details: matchError.details,
      hint: matchError.hint,
    });
  }

  if (!matchRow) {
    return {
      ok: false,
      error: "MATCH_NOT_FOUND",
      message: "No pudimos guardar el pronóstico. Probá de nuevo.",
    };
  }

  if (!matchRow.home_team_id || !matchRow.away_team_id) {
    return {
      ok: false,
      error: "MATCH_NOT_READY",
      message: "Este cruce todavía no tiene equipos definidos.",
    };
  }

  const isOpen =
    matchRow.status === "scheduled" &&
    new Date(matchRow.prediction_closes_at).getTime() > Date.now();

  if (!isOpen) {
    return {
      ok: false,
      error: "MATCH_CLOSED",
      message: "Este partido ya cerró.",
    };
  }

  const payload = {
    profile_id: user.id,
    user_id: user.id,
    match_id: normalizedMatchId,
    predicted_home: homeScore,
    predicted_away: awayScore,
    predicted_home_score: homeScore,
    predicted_away_score: awayScore,
  };

  const predictionWrite = supabase
    .from("predictions")
    .upsert(payload, { onConflict: "profile_id,match_id" })
    .select("id, match_id, predicted_home, predicted_away, locked_at, points")
    .single();

  const { data, error } = await predictionWrite;

  if (error || !data) {
    let liveProfile: { id: string } | null = null;
    let liveMatch:
      | {
          id: string;
          status: string;
          prediction_closes_at: string;
          home_team_id: string | null;
          away_team_id: string | null;
        }
      | null = null;

    try {
      const service = createServiceRoleSupabaseClient();
      const [{ data: serviceProfile }, { data: serviceMatch }] = await Promise.all([
        service.from("profiles").select("id").eq("id", user.id).maybeSingle(),
        service
          .from("matches")
          .select("id, status, prediction_closes_at, home_team_id, away_team_id")
          .eq("id", normalizedMatchId)
          .maybeSingle(),
      ]);

      liveProfile = serviceProfile;
      liveMatch = serviceMatch;
    } catch (diagnosticError) {
      console.error("[matches] prediction diagnostic service query failed", {
        userId: user.id,
        matchId: normalizedMatchId,
        diagnosticError:
          diagnosticError instanceof Error ? diagnosticError.message : String(diagnosticError),
      });
    }

    const safeError = error
      ? {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        }
      : {
          message: "No data returned from predictions upsert",
          code: null,
          details: null,
          hint: null,
        };

    console.error("[matches] prediction server action failed", {
      ...safeError,
      matchId: normalizedMatchId,
      authUserId: user.id,
      profileIdUsed: user.id,
      profileExists: Boolean(liveProfile),
      matchExists: Boolean(liveMatch),
      matchStatus: liveMatch?.status ?? matchRow.status,
      matchPredictionClosesAt: liveMatch?.prediction_closes_at ?? matchRow.prediction_closes_at,
      matchHasResolvedTeams: Boolean(
        (liveMatch?.home_team_id ?? matchRow.home_team_id) &&
          (liveMatch?.away_team_id ?? matchRow.away_team_id),
      ),
      observedAt: nowIso,
      payload,
    });

    const closedByError = `${safeError.message ?? ""} ${safeError.code ?? ""}`.toLowerCase();

    if (
      closedByError.includes("row-level security") ||
      closedByError.includes("prediction_closes_at") ||
      closedByError.includes("scheduled")
    ) {
      return {
        ok: false,
        error: "MATCH_CLOSED",
        message: "Este partido ya cerró.",
      };
    }

    if (!liveProfile) {
      return {
        ok: false,
        error: "PROFILE_MISSING",
        message: "No pudimos encontrar tu perfil de jugador. Cerrá sesión y volvé a entrar.",
      };
    }

    return {
      ok: false,
      error: "UNKNOWN",
      message: "No pudimos guardar el pronóstico. Probá de nuevo.",
    };
  }

  revalidatePath("/matches");
  revalidatePath("/dashboard");

  return {
    ok: true,
    prediction: data,
  };
}
