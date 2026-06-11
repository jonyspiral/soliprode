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
  match_id?: string;
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

// Hotfix operativo: `predictions.points` sigue siendo el storage legacy/transicional
// del scoring oficial hasta migrar a un ledger dedicado por prediction/match.
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

export async function rebuildFinishedMatchScoresAndRankings() {
  const service = createServiceRoleSupabaseClient();
  const { data: matches, error: matchesError } = await service
    .from("matches")
    .select("id, starts_at, status, score_home, score_away")
    .eq("status", "finished")
    .not("score_home", "is", null)
    .not("score_away", "is", null)
    .order("starts_at", { ascending: true });

  if (matchesError) {
    throw matchesError;
  }

  const finishedMatches = (matches ?? []) as MatchRow[];

  if (finishedMatches.length === 0) {
    await rebuildGeneralRankings();

    return {
      finishedMatchesProcessed: 0,
      predictionsProcessed: 0,
      rankedPlayers: 0,
    };
  }

  const matchIds = finishedMatches.map((match) => match.id);
  const { data: predictions, error: predictionError } = await service
    .from("predictions")
    .select("id, match_id, profile_id, predicted_home, predicted_away, locked_at")
    .in("match_id", matchIds);

  if (predictionError) {
    throw predictionError;
  }

  const predictionRows = (predictions ?? []) as PredictionRow[];
  const profileIds = [...new Set(predictionRows.map((row) => row.profile_id))];
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
  const matchMap = new Map(finishedMatches.map((match) => [match.id, match]));

  for (const prediction of predictionRows) {
    const match = typeof prediction.match_id === "string" ? matchMap.get(prediction.match_id) ?? null : null;
    const participation = participationMap.get(prediction.profile_id);

    if (!match || match.score_home === null || match.score_away === null) {
      continue;
    }

    const isEligible =
      participation?.payment_status === "paid" &&
      isEligibleForMatch(participation.eligible_from, match.starts_at);

    const points = isEligible
      ? scorePrediction(
          prediction.predicted_home,
          prediction.predicted_away,
          match.score_home,
          match.score_away,
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

  return {
    finishedMatchesProcessed: finishedMatches.length,
    predictionsProcessed: predictionRows.length,
    rankedPlayers: [...new Set(
      [...participationMap.values()]
        .filter((participation) => participation.payment_status === "paid")
        .map((participation) => participation.profile_id),
    )].length,
  };
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
