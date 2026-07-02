import { pickPrimaryParticipation } from "@/lib/participations/primary";
import { fetchAllRowsByRange } from "@/lib/supabase/pagination";
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

type RankingSpecialPredictionRow = {
  profile_id: string;
  points: number;
};

type ResolvableSpecialQuestionRow = {
  id: string;
  code: string;
  points: number;
};

type ResolvableSpecialOptionRow = {
  id: string;
  question_id: string;
  value: string;
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
  id: string;
  profile_id: string;
  points: number;
  match:
    | {
        starts_at: string;
        status: string;
      }
    | {
        starts_at: string;
        status: string;
      }[]
    | null;
};

function normalizeRankingPredictionMatch(
  match: RankingPredictionRow["match"],
) {
  if (!match) {
    return null;
  }

  if (Array.isArray(match)) {
    return match[0] ?? null;
  }

  return match;
}

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

// Hotfix operativo: `predictions.points` sigue siendo el storage legacy/transicional
// del scoring oficial hasta migrar a un ledger dedicado por prediction/match.
// Mientras no exista la mediana reglamentaria, el ranking urgente usa solo
// `payment_status = 'paid'` y no corta por `eligible_from`.
export async function rebuildGeneralRankings() {
  const service = createServiceRoleSupabaseClient();

  const [participations, rankingPredictions, rankingSpecialPredictions] = await Promise.all([
    fetchAllRowsByRange<ParticipationRow>({
      queryName: "participations_paid_general_rankings",
      fetchPage: async (from, to) =>
        service
          .from("participations")
          .select("profile_id, payment_status, eligible_from, created_at")
          .eq("payment_status", "paid")
          .order("created_at", { ascending: false })
          .order("profile_id", { ascending: true })
          .range(from, to),
    }),
    fetchAllRowsByRange<RankingPredictionRow>({
      queryName: "predictions_general_rankings",
      fetchPage: async (from, to) =>
        service
          .from("predictions")
          .select("id, profile_id, points, match:matches!inner(starts_at, status)")
          .order("id", { ascending: true })
          .range(from, to),
    }),
    fetchAllRowsByRange<RankingSpecialPredictionRow>({
      queryName: "special_predictions_general_rankings",
      fetchPage: async (from, to) =>
        service
          .from("special_predictions")
          .select("id, profile_id, points")
          .order("id", { ascending: true })
          .range(from, to),
    }),
  ]);

  const paidMap = buildPrimaryParticipationMap(participations);
  const paidParticipations = [...paidMap.values()];

  const totals = new Map<string, number>();

  for (const participation of paidParticipations) {
    totals.set(participation.profile_id, 0);
  }

  for (const row of rankingPredictions) {
    const participation = paidMap.get(row.profile_id);
    const match = normalizeRankingPredictionMatch(row.match);

    if (!participation || !match || match.status !== "finished") {
      continue;
    }

    totals.set(row.profile_id, (totals.get(row.profile_id) ?? 0) + (row.points ?? 0));
  }

  for (const row of rankingSpecialPredictions) {
    if (!paidMap.has(row.profile_id)) {
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
  const finishedMatches = await fetchAllRowsByRange<MatchRow>({
    queryName: "matches_finished_for_scoring",
    fetchPage: async (from, to) =>
      service
        .from("matches")
        .select("id, starts_at, status, score_home, score_away")
        .eq("status", "finished")
        .not("score_home", "is", null)
        .not("score_away", "is", null)
        .order("starts_at", { ascending: true })
        .order("id", { ascending: true })
        .range(from, to),
  });

  if (finishedMatches.length === 0) {
    await rebuildGeneralRankings();

    return {
      finishedMatchesProcessed: 0,
      predictionsProcessed: 0,
      rankedPlayers: 0,
    };
  }

  const matchIds = finishedMatches.map((match) => match.id);
  const predictionRows = await fetchAllRowsByRange<PredictionRow>({
    queryName: "predictions_finished_matches",
    fetchPage: async (from, to) =>
      service
        .from("predictions")
        .select("id, match_id, profile_id, predicted_home, predicted_away, locked_at")
        .in("match_id", matchIds)
        .order("id", { ascending: true })
        .range(from, to),
  });
  const profileIds = [...new Set(predictionRows.map((row) => row.profile_id))];
  const participationRows: ParticipationRow[] =
    profileIds.length > 0
      ? await fetchAllRowsByRange<ParticipationRow>({
          queryName: "participations_for_finished_match_rebuild",
          fetchPage: async (from, to) =>
            service
              .from("participations")
              .select("profile_id, payment_status, eligible_from, created_at")
              .in("profile_id", profileIds)
              .order("created_at", { ascending: false })
              .order("profile_id", { ascending: true })
              .range(from, to),
        })
      : [];

  const participationMap = buildPrimaryParticipationMap(participationRows);
  const matchMap = new Map(finishedMatches.map((match) => [match.id, match]));

  for (const prediction of predictionRows) {
    const match = typeof prediction.match_id === "string" ? matchMap.get(prediction.match_id) ?? null : null;
    const participation = participationMap.get(prediction.profile_id);

    if (!match || match.score_home === null || match.score_away === null) {
      continue;
    }

    const isEligible = participation?.payment_status === "paid";

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

  const predictionRows = await fetchAllRowsByRange<PredictionRow>({
    queryName: "predictions_single_match_publish",
    fetchPage: async (from, to) =>
      service
        .from("predictions")
        .select("id, profile_id, predicted_home, predicted_away, locked_at")
        .eq("match_id", input.matchId)
        .order("id", { ascending: true })
        .range(from, to),
  });

  const profileIds = [...new Set(predictionRows.map((row) => row.profile_id))];
  const participationRows: ParticipationRow[] =
    profileIds.length > 0
      ? await fetchAllRowsByRange<ParticipationRow>({
          queryName: "participations_single_match_publish",
          fetchPage: async (from, to) =>
            service
              .from("participations")
              .select("profile_id, payment_status, eligible_from, created_at")
              .in("profile_id", profileIds)
              .order("created_at", { ascending: false })
              .order("profile_id", { ascending: true })
              .range(from, to),
        })
      : [];

  const participationMap = buildPrimaryParticipationMap(participationRows);

  for (const prediction of predictionRows) {
    const participation = participationMap.get(prediction.profile_id);
    const isEligible = participation?.payment_status === "paid";

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

export async function resolveSpecialQuestion(questionCode: string, winningOptionId: string) {
  const service = createServiceRoleSupabaseClient();
  const normalizedQuestionCode = questionCode.trim();
  const normalizedWinningOptionId = winningOptionId.trim();

  if (!normalizedQuestionCode || !normalizedWinningOptionId) {
    throw new Error("special_question_resolution_invalid_input");
  }

  const { data: question, error: questionError } = await service
    .from("special_prediction_questions")
    .select("id, code, points")
    .eq("code", normalizedQuestionCode)
    .maybeSingle();

  if (questionError || !question) {
    throw questionError ?? new Error("special_question_not_found");
  }

  const { data: option, error: optionError } = await service
    .from("special_prediction_options")
    .select("id, question_id, value")
    .eq("id", normalizedWinningOptionId)
    .eq("question_id", question.id)
    .maybeSingle();

  if (optionError || !option) {
    throw optionError ?? new Error("special_option_not_found");
  }

  const resolvedQuestion = question as ResolvableSpecialQuestionRow;
  const resolvedOption = option as ResolvableSpecialOptionRow;

  const { error: updateQuestionError } = await service
    .from("special_prediction_questions")
    .update({
      result_value: resolvedOption.value,
      status: "resolved",
    })
    .eq("id", resolvedQuestion.id);

  if (updateQuestionError) {
    throw updateQuestionError;
  }

  const predictions = await fetchAllRowsByRange<{ id: string; option_id: string }>({
    queryName: "special_predictions_question_resolution",
    fetchPage: async (from, to) =>
      service
        .from("special_predictions")
        .select("id, option_id")
        .eq("question_id", resolvedQuestion.id)
        .order("id", { ascending: true })
        .range(from, to),
  });

  for (const prediction of predictions) {
    const points = prediction.option_id === resolvedOption.id ? resolvedQuestion.points : 0;
    const { error: updatePredictionError } = await service
      .from("special_predictions")
      .update({ points })
      .eq("id", prediction.id);

    if (updatePredictionError) {
      throw updatePredictionError;
    }
  }

  await rebuildGeneralRankings();

  return {
    questionId: resolvedQuestion.id,
    questionCode: resolvedQuestion.code,
    winningOptionId: resolvedOption.id,
    resultValue: resolvedOption.value,
    updatedPredictions: predictions.length,
  };
}
