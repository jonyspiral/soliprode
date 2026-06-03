import Link from "next/link";
import { PredictionBoard, type MatchBoardItem } from "@/components/matches/prediction-board";
import { PageStack } from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";
import { pickPrimaryParticipation } from "@/lib/participations/primary";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { withSupabaseTimeout } from "@/lib/supabase/timeouts";

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
  home_team: {
    id: string;
    name: string;
    short_name: string;
    fifa_code: string;
    country_code: string;
    flag_emoji: string | null;
  }[] | null;
  away_team: {
    id: string;
    name: string;
    short_name: string;
    fifa_code: string;
    country_code: string;
    flag_emoji: string | null;
  }[] | null;
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

    const matchQuery = supabase
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

    const [{ data: matchRows }, { data: participationRows }, { data: predictionRows }] =
      await withSupabaseTimeout(
        Promise.all([matchQuery, participationQuery, predictionQuery]),
        "Supabase matches query timed out",
      );

    matches = ((matchRows ?? []) as MatchRow[])
      .map((match) => {
        const homeTeam = match.home_team?.[0] ?? null;
        const awayTeam = match.away_team?.[0] ?? null;

        if (!homeTeam || !awayTeam) {
          return null;
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
          home_team: homeTeam,
          away_team: awayTeam,
        };
      })
      .filter((match): match is MatchBoardItem => Boolean(match));

    predictions = (predictionRows ?? []) as PredictionRow[];
    participationStatus =
      pickPrimaryParticipation(
        (participationRows ?? []) as Array<{ created_at: string; payment_status: string }>,
      ).participation?.payment_status ?? "pending";
  } catch {
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
