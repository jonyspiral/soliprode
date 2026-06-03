import Link from "next/link";
import { PredictionBoard, type MatchBoardItem } from "@/components/matches/prediction-board";
import { PageStack } from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";
import { pickPrimaryParticipation } from "@/lib/participations/primary";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { withSupabaseTimeout } from "@/lib/supabase/timeouts";

export const dynamic = "force-dynamic";

type MatchRow = {
  id: string;
  stage: string;
  round_name: string;
  group_code: string | null;
  starts_at: string;
  prediction_closes_at: string;
  status: string;
  venue: string | null;
  city: string | null;
  home_team_id: string;
  away_team_id: string;
  home_team:
    | {
        id: string;
        name: string;
        short_name: string;
        fifa_code: string;
        country_code: string;
        flag_emoji: string | null;
      }
    | {
        id: string;
        name: string;
        short_name: string;
        fifa_code: string;
        country_code: string;
        flag_emoji: string | null;
      }[]
    | null;
  away_team:
    | {
        id: string;
        name: string;
        short_name: string;
        fifa_code: string;
        country_code: string;
        flag_emoji: string | null;
      }
    | {
        id: string;
        name: string;
        short_name: string;
        fifa_code: string;
        country_code: string;
        flag_emoji: string | null;
      }[]
    | null;
};

type TeamRow = {
  id: string;
  name: string;
  short_name: string;
  fifa_code: string;
  country_code: string;
  flag_emoji: string | null;
};

type PredictionRow = {
  id: string;
  match_id: string;
  predicted_home: number;
  predicted_away: number;
  locked_at: string | null;
  points: number;
};

function groupMatches(matches: MatchBoardItem[]) {
  return matches.reduce<Record<string, MatchBoardItem[]>>((acc, match) => {
    const groupKey = match.group_code ?? "Sin grupo";
    acc[groupKey] ??= [];
    acc[groupKey].push(match);
    return acc;
  }, {});
}

function normalizeRelatedTeam(team: MatchRow["home_team"] | MatchRow["away_team"]) {
  if (!team) {
    return null;
  }

  return Array.isArray(team) ? (team[0] ?? null) : team;
}

function fallbackTeam(teamId: string): MatchBoardItem["home_team"] {
  return {
    id: teamId,
    name: "Equipo",
    short_name: "Equipo",
    fifa_code: "TBD",
    country_code: "",
    flag_emoji: null,
  };
}

function isDynamicServerUsageError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    (error as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE"
  );
}

async function loadMatchesWithTeams(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const directMatchQuery = supabase
    .from("matches")
    .select(
      `
        id,
        stage,
        round_name,
        group_code,
        starts_at,
        prediction_closes_at,
        status,
        venue,
        city,
        home_team_id,
        away_team_id,
        home_team:teams!matches_home_team_id_fkey(
          id,
          name,
          short_name,
          fifa_code,
          country_code,
          flag_emoji
        ),
        away_team:teams!matches_away_team_id_fkey(
          id,
          name,
          short_name,
          fifa_code,
          country_code,
          flag_emoji
        )
      `,
    )
    .order("starts_at", { ascending: true });

  const { data: directRows, error: directError } = await directMatchQuery;

  if (directError) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[matches] direct join query failed", directError);
    }
  } else if (directRows) {
    const normalizedMatches = (directRows as MatchRow[]).map((match) => {
      const homeTeam = normalizeRelatedTeam(match.home_team);
      const awayTeam = normalizeRelatedTeam(match.away_team);

      return {
        id: match.id,
        stage: match.stage,
        round_name: match.round_name,
        group_code: match.group_code,
        starts_at: match.starts_at,
        prediction_closes_at: match.prediction_closes_at,
        status: match.status,
        venue: match.venue,
        city: match.city,
        home_team: homeTeam ?? fallbackTeam(match.home_team_id),
        away_team: awayTeam ?? fallbackTeam(match.away_team_id),
      };
    });

    const hasMissingTeams = normalizedMatches.some(
      (match) => match.home_team.fifa_code === "TBD" || match.away_team.fifa_code === "TBD",
    );

    if (!hasMissingTeams) {
      return { matches: normalizedMatches, usedFallback: false };
    }

    console.warn("[matches] direct join returned matches with missing teams, switching to two-step fallback");
  }

  const { data: baseMatchRows, error: baseMatchError } = await supabase
    .from("matches")
    .select(
      "id, stage, round_name, group_code, starts_at, prediction_closes_at, status, venue, city, home_team_id, away_team_id",
    )
    .order("starts_at", { ascending: true });

  if (baseMatchError) {
    throw baseMatchError;
  }

  const teamIds = [...new Set(((baseMatchRows ?? []) as MatchRow[]).flatMap((match) => [match.home_team_id, match.away_team_id]))];
  const { data: teamRows, error: teamError } = teamIds.length
    ? await supabase
        .from("teams")
        .select("id, name, short_name, fifa_code, country_code, flag_emoji")
        .in("id", teamIds)
    : { data: [], error: null };

  if (teamError) {
    throw teamError;
  }

  const teamMap = new Map(((teamRows ?? []) as TeamRow[]).map((team) => [team.id, team]));

  const matches = ((baseMatchRows ?? []) as MatchRow[]).map((match) => {
    const homeTeam = teamMap.get(match.home_team_id);
    const awayTeam = teamMap.get(match.away_team_id);

    if (!homeTeam || !awayTeam) {
      console.warn("[matches] missing team data for match", {
        matchId: match.id,
        homeTeamId: match.home_team_id,
        awayTeamId: match.away_team_id,
      });
    }

    return {
      id: match.id,
      stage: match.stage,
      round_name: match.round_name,
      group_code: match.group_code,
      starts_at: match.starts_at,
      prediction_closes_at: match.prediction_closes_at,
      status: match.status,
      venue: match.venue,
      city: match.city,
      home_team: homeTeam ?? fallbackTeam(match.home_team_id),
      away_team: awayTeam ?? fallbackTeam(match.away_team_id),
    };
  });

  return { matches, usedFallback: true };
}

export default async function MatchesPage() {
  let matches: MatchBoardItem[] = [];
  let predictions: PredictionRow[] = [];
  let currentUserId: string | null = null;
  let participationStatus = "pending";
  let dataNotice: string | null = null;

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await withSupabaseTimeout(supabase.auth.getUser(), "Supabase session check timed out");

    currentUserId = user?.id ?? null;

    const participationQuery = currentUserId
      ? supabase
          .from("participations")
          .select("payment_status, created_at")
          .eq("profile_id", currentUserId)
          .order("created_at", { ascending: false })
          .limit(2)
      : Promise.resolve({ data: null, error: null });

    const predictionQuery = currentUserId
      ? supabase
          .from("predictions")
          .select("id, match_id, predicted_home, predicted_away, locked_at, points")
          .eq("profile_id", currentUserId)
      : Promise.resolve({ data: [], error: null });

    const [{ matches: loadedMatches }, { data: participationRows }, { data: predictionRows }] =
      await withSupabaseTimeout(
        Promise.all([loadMatchesWithTeams(supabase), participationQuery, predictionQuery]),
        "Supabase matches query timed out",
      );

    matches = loadedMatches;
    predictions = (predictionRows ?? []) as PredictionRow[];
    participationStatus =
      pickPrimaryParticipation(
        (participationRows ?? []) as Array<{ created_at: string; payment_status: string }>,
      ).participation?.payment_status ?? "pending";
  } catch (error) {
    if (isDynamicServerUsageError(error)) {
      throw error;
    }

    console.error("[matches] failed to load real matches", error);
    dataNotice = "No pudimos cargar los partidos ahora. Reintentá en unos minutos.";
  }

  const participationActive = participationStatus === "paid";
  const groupedMatches = groupMatches(matches);
  const orderedGroupCodes = Object.keys(groupedMatches).sort();
  const subcopy = currentUserId
    ? participationActive
      ? "Tus pronósticos ya compiten en el ranking."
      : "Tus pronósticos quedan guardados. Terminá tu inscripción para competir por premios."
    : "Entrá al Prode para guardar tus pronósticos cuando esté el fixture.";

  return (
    <PageStack>
      <section className="rounded-[1.4rem] bg-[linear-gradient(180deg,#0047ab_0%,#00327d_100%)] p-4 text-white shadow-[0_12px_28px_rgba(0,50,125,0.18)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#dfe6ff]">
          Mundial 2026
        </p>
        <h1 className="mt-2 font-serif text-[2.15rem] font-bold uppercase leading-[0.92] tracking-[-0.03em]">
          Cargá tus
          <br />
          pronósticos
        </h1>
        <p className="mt-3 max-w-[34rem] text-sm leading-6 text-[#dfe6ff]">{subcopy}</p>
      </section>

      {currentUserId && !participationActive ? (
        <div className="flex flex-col gap-3 rounded-[1.15rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-[0_10px_24px_rgba(0,50,125,0.05)] sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            Tus pronósticos quedan guardados. Terminá tu inscripción para competir por premios.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#e7ca55] bg-[#ffe16d] px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-ink)]"
          >
            Pagar con Mercado Pago
          </Link>
        </div>
      ) : null}

      {dataNotice ? (
        <SurfaceCard title="Partidos" description={dataNotice}>
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm font-semibold text-[var(--color-ink)]"
          >
            Volver al panel
          </Link>
        </SurfaceCard>
      ) : null}

      {!dataNotice && matches.length === 0 ? (
        <SurfaceCard
          title="Todavía no hay partidos cargados"
          description="Cuando esté el fixture, vas a poder cargar tus pronósticos acá."
        >
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm font-semibold text-[var(--color-ink)]"
          >
            Volver al panel
          </Link>
        </SurfaceCard>
      ) : null}

      {!dataNotice && matches.length > 0
        ? orderedGroupCodes.map((groupCode) => (
            <SurfaceCard
              key={groupCode}
              title={groupCode === "Sin grupo" ? "Partidos" : `Grupo ${groupCode}`}
              description={`${groupedMatches[groupCode]?.length ?? 0} partido${(groupedMatches[groupCode]?.length ?? 0) === 1 ? "" : "s"} cargado${(groupedMatches[groupCode]?.length ?? 0) === 1 ? "" : "s"}.`}
            >
              <PredictionBoard
                matches={groupedMatches[groupCode] ?? []}
                initialPredictions={predictions}
                currentUserId={currentUserId}
                isAuthenticated={Boolean(currentUserId)}
                participationActive={participationActive}
              />
            </SurfaceCard>
          ))
        : null}
    </PageStack>
  );
}
