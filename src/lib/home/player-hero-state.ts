import { getGroupCompetitionSnapshot } from "@/lib/groups/competition";
import { resolveParticipationUiState } from "@/lib/participations/status";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { withSupabaseTimeout } from "@/lib/supabase/timeouts";

type RankingRow = {
  points: number;
  position: number | null;
};

type ProfileRow = {
  public_alias: string | null;
};

export type GuestHeroState = {
  kind: "guest";
  primaryAction: {
    href: string;
    label: string;
  };
  secondaryAction: {
    href: string;
    label: string;
  };
};

export type RegisteredHeroState = {
  kind: "registered";
  alias: string | null;
  statusLabel: string;
  supportText: string;
  predictionCountLabel: string;
};

export type ActiveHeroState = {
  kind: "active";
  alias: string | null;
  statusLabel: string;
  supportText: string;
  metrics: Array<{
    label: string;
    value: string;
    detail: string;
  }>;
};

export type HomeHeroState = GuestHeroState | RegisteredHeroState | ActiveHeroState;

function formatPredictionCountLabel(predictionCount: number) {
  return `${predictionCount} pronóstico${predictionCount === 1 ? "" : "s"} cargado${predictionCount === 1 ? "" : "s"}`;
}

export async function getPlayerHeroState(params: {
  userId: string;
  isPaid: boolean;
  guestFallback?: never;
}): Promise<RegisteredHeroState | ActiveHeroState> {
  const supabase = await createServerSupabaseClient();

  const profileQuery = supabase
    .from("profiles")
    .select("public_alias")
    .eq("id", params.userId)
    .maybeSingle();

  const predictionCountQuery = supabase
    .from("predictions")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", params.userId);

  const rankingQuery = params.isPaid
    ? supabase
        .from("rankings_cache")
        .select("points, position")
        .eq("ranking_type", "general")
        .is("scope_id", null)
        .eq("profile_id", params.userId)
        .maybeSingle()
    : Promise.resolve({ data: null, error: null });

  const [profileResult, predictionResult, rankingResult, groupSnapshot] = await withSupabaseTimeout(
    Promise.all([
      profileQuery,
      predictionCountQuery,
      rankingQuery,
      getGroupCompetitionSnapshot(params.userId),
    ]),
    "Supabase home player summary timed out",
  );

  const alias = (profileResult.data as ProfileRow | null)?.public_alias ?? null;
  const predictionCount = predictionResult.count ?? 0;
  const predictionCountLabel = formatPredictionCountLabel(predictionCount);
  const participationUiState = resolveParticipationUiState(groupSnapshot.currentParticipationStatus);

  if (!params.isPaid) {
    return {
      kind: "registered",
      alias,
      statusLabel: participationUiState.statusLabel,
      supportText: participationUiState.supportText,
      predictionCountLabel,
    };
  }

  const ranking = (rankingResult.data as RankingRow | null) ?? null;
  const currentGroup = groupSnapshot.currentGroup;

  return {
    kind: "active",
    alias,
    statusLabel: participationUiState.statusLabel,
    supportText: participationUiState.supportText,
    metrics: [
      {
        label: "Tus puntos",
        value: ranking ? `${ranking.points}` : "--",
        detail: ranking ? "Score oficial actual." : "Todavía sin score oficial.",
      },
      {
        label: "Tu puesto",
        value: ranking?.position ? `#${ranking.position}` : "--",
        detail: ranking?.position ? "Posición en el ranking general." : "Todavía sin puesto oficial.",
      },
      {
        label: "Tu Team",
        value: currentGroup?.name ?? "Sin Team",
        detail: currentGroup
          ? `${currentGroup.activeCount} activos en el Plantel.`
          : "Todavía no estás jugando en un Team.",
      },
      {
        label: "Score Team",
        value: currentGroup ? `${currentGroup.teamScore}` : "--",
        detail: currentGroup
          ? currentGroup.isEligible
            ? `#${currentGroup.position} entre los Teams.`
            : "Preview hasta completar 11 activos."
          : predictionCountLabel,
      },
    ],
  };
}
