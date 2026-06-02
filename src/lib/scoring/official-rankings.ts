import { pickPrimaryParticipation } from "@/lib/participations/primary";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

type MatchRow = {
  id: string;
  starts_at: string;
  status: string;
  score_home: number | null;
  score_away: number | null;
};

type PredictionRow = {
  id: string;
  profile_id: string;
  predicted_home: number;
  predicted_away: number;
  locked_at: string | null;
};

type ParticipationRow = {
  created_at: string;
  profile_id: string;
  payment_status: string;
  eligible_from: string | null;
};

function buildPrimaryParticipationMap(rows: ParticipationRow[]) {
  const rowsByProfile = new Map<string, ParticipationRow[]>();

  for (const row of rows) {
    const existingRows = rowsByProfile.get(row.profile_id) ?? [];
    existingRows.push(row);
    rowsByProfile.set(row.profile_id, existingRows);
  }

  const primaryMap = new Map<string, ParticipationRow>();

  for (const [profileId, profileRows] of rowsByProfile.entries()) {
    const primary = pickPrimaryParticipation(profileRows).participation;

    if (primary) {
      primaryMap.set(profileId, primary);
    }
  }

  return primaryMap;
}

type RankingPredictionRow = {
  profile_id: string;
  points: number;
  match: {
    starts_at: string;
    status: string;
  }[] | null;
};

function getOutcome(home: number, away: number) {
  if (home === away) {
    return "draw";
  }

  return home > away ? "home" : "away";
}

function scorePrediction(
  predictionHome: number,
  predictionAway: number,
  actualHome: number,
  actualAway: number,
) {
  if (predictionHome === actualHome && predictionAway === actualAway) {
    return 5;
  }

  if (getOutcome(predictionHome, predictionAway) === getOutcome(actualHome, actualAway)) {
    return 3;
  }

  return 0;
}

function isEligibleForMatch(eligibleFrom: string | null, startsAt: string) {
  if (!eligibleFrom) {
    return true;
  }

  return new Date(startsAt).getTime() >= new Date(eligibleFrom).getTime();
}

export async function rebuildGeneralRankings() {
  const service = createServiceRoleSupabaseClient();

  const [{ data: participations, error: participationError }, { data: rankingPredictions, error: predictionError }] =
    await Promise.all([
      service
        .from("participations")
        .select("profile_id, payment_status, eligible_from, created_at")
        .eq("payment_status", "paid")
        .order("created_at", { ascending: false }),
      service
        .from("predictions")
        .select("profile_id, points, match:matches!inner(starts_at, status)"),
    ]);

  if (participationError) {
    throw participationError;
  }

  if (predictionError) {
    throw predictionError;
  }

  const paidMap = buildPrimaryParticipationMap((participations ?? []) as ParticipationRow[]);
  const paidParticipations = [...paidMap.values()];

  const totals = new Map<string, number>();

  for (const participation of paidParticipations) {
    totals.set(participation.profile_id, 0);
  }

  for (const row of (rankingPredictions ?? []) as RankingPredictionRow[]) {
    const participation = paidMap.get(row.profile_id);
    const match = row.match?.[0];

    if (!participation || !match || match.status !== "finished") {
      continue;
    }

    if (!isEligibleForMatch(participation.eligible_from, match.starts_at)) {
      continue;
    }

    totals.set(row.profile_id, (totals.get(row.profile_id) ?? 0) + (row.points ?? 0));
  }

  const sorted = [...totals.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) {
        return b[1] - a[1];
      }

      return a[0].localeCompare(b[0]);
    })
    .map(([profileId, points], index) => ({
      ranking_type: "general",
      scope_id: null,
      profile_id: profileId,
      points,
      position: index + 1,
      updated_at: new Date().toISOString(),
    }));

  await service.from("rankings_cache").delete().eq("ranking_type", "general").is("scope_id", null);

  if (sorted.length > 0) {
    const { error: insertError } = await service.from("rankings_cache").insert(sorted);

    if (insertError) {
      throw insertError;
    }
  }
}

export async function publishMatchResultAndScore(input: {
  matchId: string;
  scoreHome: number;
  scoreAway: number;
}) {
  const service = createServiceRoleSupabaseClient();

  const { data: match, error: matchError } = await service
    .from("matches")
    .update({
      score_home: input.scoreHome,
      score_away: input.scoreAway,
      status: "finished",
    })
    .eq("id", input.matchId)
    .select("id, starts_at, status, score_home, score_away")
    .single();

  if (matchError || !match) {
    throw matchError ?? new Error("match_update_failed");
  }

  const { data: predictions, error: predictionError } = await service
    .from("predictions")
    .select("id, profile_id, predicted_home, predicted_away, locked_at")
    .eq("match_id", input.matchId);

  if (predictionError) {
    throw predictionError;
  }

  const profileIds = [...new Set(((predictions ?? []) as PredictionRow[]).map((row) => row.profile_id))];
  const participationRows =
    profileIds.length > 0
      ? await service
          .from("participations")
          .select("profile_id, payment_status, eligible_from, created_at")
          .in("profile_id", profileIds)
          .order("created_at", { ascending: false })
      : { data: [], error: null };

  if (participationRows.error) {
    throw participationRows.error;
  }

  const participationMap = buildPrimaryParticipationMap(
    (participationRows.data ?? []) as ParticipationRow[],
  );

  for (const prediction of (predictions ?? []) as PredictionRow[]) {
    const participation = participationMap.get(prediction.profile_id);
    const isEligible =
      participation?.payment_status === "paid" &&
      isEligibleForMatch(participation.eligible_from, match.starts_at);

    const points = isEligible
      ? scorePrediction(
          prediction.predicted_home,
          prediction.predicted_away,
          input.scoreHome,
          input.scoreAway,
        )
      : 0;

    const { error: updatePredictionError } = await service
      .from("predictions")
      .update({
        points,
        locked_at: prediction.locked_at ?? match.starts_at,
      })
      .eq("id", prediction.id);

    if (updatePredictionError) {
      throw updatePredictionError;
    }
  }

  await rebuildGeneralRankings();

  return match as MatchRow;
}
