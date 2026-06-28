import Link from "next/link";
import { PredictionBoard, type MatchBoardItem } from "@/components/matches/prediction-board";
import { PageStack } from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";
import { formatZoneLabel, normalizeZoneCode, NO_ZONE_KEY } from "@/lib/fixture/zone-labels";
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
  home_score: number | null;
  away_score: number | null;
  home_slot_rule: string | null;
  away_slot_rule: string | null;
  home_slot_label: string | null;
  away_slot_label: string | null;
  bracket_position: string | null;
  bracket_side: string | null;
  home_team_id: string | null;
  away_team_id: string | null;
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

type MatchesPageProps = {
  searchParams?: Promise<{
    zona?: string;
    zone?: string;
    view?: string;
    tab?: string;
  }>;
};

type MatchesTabKey =
  | "upcoming"
  | "round_of_32"
  | "group_stage"
  | "specials"
  | "round_of_16"
  | "quarter_finals"
  | "semi_finals"
  | "final";

const MATCH_TABS: Array<{ key: MatchesTabKey; label: string }> = [
  { key: "upcoming", label: "Próximos" },
  { key: "round_of_32", label: "Dieciseisavos" },
  { key: "group_stage", label: "Fase de grupos" },
  { key: "specials", label: "Especiales" },
  { key: "round_of_16", label: "Octavos" },
  { key: "quarter_finals", label: "Cuartos" },
  { key: "semi_finals", label: "Semis" },
  { key: "final", label: "Final" },
];

function sortMatchesByKickoff(matches: MatchBoardItem[]) {
  return [...matches].sort((a, b) => {
    const kickoffA = new Date(a.starts_at).getTime();
    const kickoffB = new Date(b.starts_at).getTime();
    const hasValidA = Number.isFinite(kickoffA);
    const hasValidB = Number.isFinite(kickoffB);

    if (hasValidA && hasValidB) {
      if (kickoffA !== kickoffB) {
        return kickoffA - kickoffB;
      }
      return a.id.localeCompare(b.id);
    }

    if (hasValidA) {
      return -1;
    }

    if (hasValidB) {
      return 1;
    }

    return a.id.localeCompare(b.id);
  });
}

function groupMatches(matches: MatchBoardItem[]) {
  return matches.reduce<Record<string, MatchBoardItem[]>>((acc, match) => {
    const groupKey = match.group_code ?? NO_ZONE_KEY;
    acc[groupKey] ??= [];
    acc[groupKey].push(match);
    return acc;
  }, {});
}

function buildMatchesHref({
  tab,
  zoneCode,
  viewMode,
}: {
  tab: MatchesTabKey;
  zoneCode?: string | null;
  viewMode?: "fecha" | "zonas";
}) {
  const params = new URLSearchParams();

  params.set("tab", tab);

  if (tab === "group_stage" && zoneCode) {
    params.set("zona", zoneCode);
  }

  if (tab === "group_stage" && viewMode) {
    params.set("view", viewMode);
  }

  const queryString = params.toString();
  return queryString ? `/matches?${queryString}` : "/matches";
}

function getExistingZoneCodes(matches: MatchBoardItem[]) {
  return [...new Set(matches.map((match) => normalizeZoneCode(match.group_code)).filter(Boolean))]
    .sort() as string[];
}

function normalizeRelatedTeam(team: MatchRow["home_team"] | MatchRow["away_team"]) {
  if (!team) {
    return null;
  }

  return Array.isArray(team) ? (team[0] ?? null) : team;
}

function fallbackTeam(teamId: string): NonNullable<MatchBoardItem["home_team"]> {
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

function isFutureScheduledMatch(match: MatchBoardItem) {
  return match.status === "scheduled" && new Date(match.prediction_closes_at).getTime() > Date.now();
}

function mapStageToTab(stage: string): MatchesTabKey | null {
  switch (stage) {
    case "group_stage":
      return "group_stage";
    case "round_of_32":
      return "round_of_32";
    case "round_of_16":
      return "round_of_16";
    case "quarter_finals":
      return "quarter_finals";
    case "semi_finals":
      return "semi_finals";
    case "third_place":
    case "final":
      return "final";
    default:
      return null;
  }
}

function normalizeMatchesTab(value: string | undefined): MatchesTabKey | null {
  if (!value) {
    return null;
  }

  return MATCH_TABS.find((tab) => tab.key === value)?.key ?? null;
}

function getAvailableTabs(matches: MatchBoardItem[]) {
  const available = new Set<MatchesTabKey>();

  if (matches.some(isFutureScheduledMatch)) {
    available.add("upcoming");
  }

  for (const match of matches) {
    const tab = mapStageToTab(match.stage);

    if (tab) {
      available.add(tab);
    }
  }

  available.add("specials");

  return MATCH_TABS.filter((tab) => available.has(tab.key));
}

function pickDefaultTab(matches: MatchBoardItem[]) {
  if (matches.some(isFutureScheduledMatch)) {
    return "upcoming" as const;
  }

  if (matches.some((match) => match.stage === "round_of_32")) {
    return "round_of_32" as const;
  }

  return (getAvailableTabs(matches)[0]?.key ?? "group_stage") as MatchesTabKey;
}

function getTabMatches(matches: MatchBoardItem[], tab: MatchesTabKey) {
  if (tab === "upcoming") {
    return matches.filter(isFutureScheduledMatch);
  }

  if (tab === "specials") {
    return [];
  }

  return matches.filter((match) => mapStageToTab(match.stage) === tab);
}

function normalizeMatchRow(match: MatchRow): MatchBoardItem {
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
    home_score: match.home_score,
    away_score: match.away_score,
    home_slot_rule: match.home_slot_rule,
    away_slot_rule: match.away_slot_rule,
    home_slot_label: match.home_slot_label,
    away_slot_label: match.away_slot_label,
    bracket_position: match.bracket_position,
    bracket_side: match.bracket_side,
    home_team: homeTeam ?? (match.home_team_id ? fallbackTeam(match.home_team_id) : null),
    away_team: awayTeam ?? (match.away_team_id ? fallbackTeam(match.away_team_id) : null),
  };
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
        home_score,
        away_score,
        home_slot_rule,
        away_slot_rule,
        home_slot_label,
        away_slot_label,
        bracket_position,
        bracket_side,
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
    const rawMatches = directRows as MatchRow[];
    const normalizedMatches = rawMatches.map(normalizeMatchRow);

    const hasBrokenTeamJoin = rawMatches.some(
      (match) =>
        (match.home_team_id && !normalizeRelatedTeam(match.home_team)) ||
        (match.away_team_id && !normalizeRelatedTeam(match.away_team)),
    );

    if (!hasBrokenTeamJoin) {
      return { matches: normalizedMatches, usedFallback: false };
    }

    console.warn("[matches] direct join returned unresolved team references, switching to two-step fallback");
  }

  const { data: baseMatchRows, error: baseMatchError } = await supabase
    .from("matches")
    .select(
      "id, stage, round_name, group_code, starts_at, prediction_closes_at, status, venue, city, home_score, away_score, home_slot_rule, away_slot_rule, home_slot_label, away_slot_label, bracket_position, bracket_side, home_team_id, away_team_id",
    )
    .order("starts_at", { ascending: true });

  if (baseMatchError) {
    throw baseMatchError;
  }

  const teamIds = [
    ...new Set(
      ((baseMatchRows ?? []) as MatchRow[])
        .flatMap((match) => [match.home_team_id, match.away_team_id])
        .filter((teamId): teamId is string => Boolean(teamId)),
    ),
  ];
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
    const homeTeam = match.home_team_id ? teamMap.get(match.home_team_id) : null;
    const awayTeam = match.away_team_id ? teamMap.get(match.away_team_id) : null;

    if ((match.home_team_id && !homeTeam) || (match.away_team_id && !awayTeam)) {
      console.warn("[matches] missing team data for match", {
        matchId: match.id,
        homeTeamId: match.home_team_id,
        awayTeamId: match.away_team_id,
      });
    }

    return normalizeMatchRow({
      ...match,
      home_team: homeTeam ?? null,
      away_team: awayTeam ?? null,
    });
  });

  return { matches, usedFallback: true };
}

export default async function MatchesPage({ searchParams }: MatchesPageProps) {
  const params = searchParams ? await searchParams : undefined;
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
          .limit(10)
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
  const requestedTab = normalizeMatchesTab(params?.tab);
  const availableTabs = getAvailableTabs(matches);
  const defaultTab = pickDefaultTab(matches);
  const currentTab = availableTabs.some((tab) => tab.key === requestedTab)
    ? (requestedTab as MatchesTabKey)
    : defaultTab;
  const selectedTabLabel = MATCH_TABS.find((tab) => tab.key === currentTab)?.label ?? "Partidos";
  const existingZoneCodes = getExistingZoneCodes(
    matches.filter((match) => match.stage === "group_stage"),
  );
  const requestedZoneCode = normalizeZoneCode(params?.zona ?? params?.zone);
  const currentView: "fecha" | "zonas" = params?.view === "zonas" ? "zonas" : "fecha";
  const selectedZoneCode =
    currentTab === "group_stage" && requestedZoneCode && existingZoneCodes.includes(requestedZoneCode)
      ? requestedZoneCode
      : null;
  const upcomingMatches = sortMatchesByKickoff(getTabMatches(matches, "upcoming"));
  const historicalMatches = sortMatchesByKickoff(matches.filter((match) => !isFutureScheduledMatch(match)));
  const currentTabMatches = sortMatchesByKickoff(getTabMatches(matches, currentTab));
  const currentTabZoneFilteredMatches =
    currentTab === "group_stage" && selectedZoneCode
      ? currentTabMatches.filter((match) => normalizeZoneCode(match.group_code) === selectedZoneCode)
      : currentTabMatches;
  const groupedMatches = groupMatches(currentTabZoneFilteredMatches);
  const orderedGroupCodes = Object.keys(groupedMatches).sort();
  const hasGroupStageHistory =
    matches.some((match) => match.stage === "group_stage") &&
    matches
      .filter((match) => match.stage === "group_stage")
      .every((match) => !isFutureScheduledMatch(match));
  const subcopy = currentUserId
    ? participationActive
      ? "Tus pronósticos ya compiten en el ranking."
      : "Tus pronósticos quedan guardados. Activá tu Pase Solidario para competir."
    : "Entrá al Prode para guardar tus pronósticos cuando esté el fixture.";
  const tabDescription =
    currentTab === "upcoming"
      ? "Estos son los partidos activos para cargar tus pronósticos."
      : currentTab === "group_stage" && hasGroupStageHistory
        ? "Fase de grupos finalizada. Podés revisar tus pronósticos anteriores."
        : currentTab === "specials"
          ? "Pronto vas a poder cargar campeón, subcampeón, goleador y otras predicciones especiales."
          : currentTab === "round_of_32"
            ? "Estos son los partidos activos para cargar tus pronósticos."
            : `Revisá los partidos de ${selectedTabLabel.toLowerCase()} y preparate para la próxima ronda.`;
  const heroTitle = currentTab === "upcoming" ? "Pronosticá lo que viene" : `Pronosticá ${selectedTabLabel.toLowerCase()}`;

  return (
    <PageStack>
      <section
        className={[
          "rounded-[1.4rem] bg-[linear-gradient(180deg,#0047ab_0%,#00327d_100%)] text-white shadow-[0_12px_28px_rgba(0,50,125,0.18)]",
          currentUserId ? "p-4" : "p-5",
        ].join(" ")}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#dfe6ff]">
          Mundial 2026
        </p>
        <h1
          className={[
            "mt-2 font-serif font-bold uppercase leading-[0.92] tracking-[-0.03em]",
            currentUserId ? "text-[1.8rem] sm:text-[2rem]" : "text-[2.15rem]",
          ].join(" ")}
        >
          {heroTitle}
        </h1>
        <p className="mt-2 max-w-[34rem] text-sm leading-6 text-[#dfe6ff]">{subcopy}</p>
      </section>

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

      {!dataNotice && matches.length > 0 ? (
        <nav
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0"
          aria-label="Instancias del fixture"
        >
          {availableTabs.map((tab) => (
            <Link
              key={tab.key}
              href={buildMatchesHref({ tab: tab.key })}
              className={[
                "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold",
                currentTab === tab.key
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                  : "border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-muted)]",
              ].join(" ")}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      ) : null}

      {!dataNotice && matches.length > 0 && currentTab === "group_stage" ? (
        <nav
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0"
          aria-label="Modo de visualización de fase de grupos"
        >
          <Link
            href={buildMatchesHref({ tab: "group_stage", zoneCode: selectedZoneCode, viewMode: "fecha" })}
            className={[
              "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold",
              currentView === "fecha"
                ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                : "border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-muted)]",
            ].join(" ")}
          >
            Por fecha
          </Link>
          <Link
            href={buildMatchesHref({ tab: "group_stage", zoneCode: selectedZoneCode, viewMode: "zonas" })}
            className={[
              "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold",
              currentView === "zonas"
                ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                : "border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-muted)]",
            ].join(" ")}
          >
            Por zonas
          </Link>
        </nav>
      ) : null}

      {!dataNotice && matches.length > 0 && currentTab === "group_stage" ? (
        <nav
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0"
          aria-label="Filtrar partidos por zona"
        >
          <Link
            href={buildMatchesHref({ tab: "group_stage", viewMode: currentView })}
            className={[
              "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold",
              selectedZoneCode
                ? "border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-muted)]"
                : "border-[var(--color-primary)] bg-[var(--color-primary)] text-white",
            ].join(" ")}
          >
            Todas
          </Link>
          {existingZoneCodes.map((zoneCode) => (
            <Link
              key={zoneCode}
              href={buildMatchesHref({ tab: "group_stage", zoneCode, viewMode: currentView })}
              className={[
                "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold",
                selectedZoneCode === zoneCode
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                  : "border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-muted)]",
              ].join(" ")}
            >
              {formatZoneLabel(zoneCode)}
            </Link>
          ))}
        </nav>
      ) : null}

      {!dataNotice && matches.length > 0 && currentTab === "upcoming" ? (
        <SurfaceCard
          title="Próximos partidos para pronosticar"
          description={tabDescription}
        >
          <PredictionBoard
            matches={upcomingMatches}
            initialPredictions={predictions}
            currentUserId={currentUserId}
            isAuthenticated={Boolean(currentUserId)}
            participationActive={participationActive}
            compactClosedCards
          />
        </SurfaceCard>
      ) : null}

      {!dataNotice && matches.length > 0 && currentTab === "upcoming" && historicalMatches.length > 0 ? (
        <details className="group rounded-[1.25rem] border-[1.5px] border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-[0_10px_24px_rgba(0,50,125,0.05)] md:p-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-[1.55rem] font-bold uppercase leading-none text-[var(--color-ink)]">
                Partidos anteriores
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                Fase de grupos finalizada. Podés revisar tus pronósticos anteriores.
              </p>
            </div>
            <span className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
              Ver historial
            </span>
          </summary>
          <div className="mt-4">
            <PredictionBoard
              matches={historicalMatches}
              initialPredictions={predictions}
              currentUserId={currentUserId}
              isAuthenticated={Boolean(currentUserId)}
              participationActive={participationActive}
              compactClosedCards
              showAccessNotice={false}
            />
          </div>
        </details>
      ) : null}

      {!dataNotice && matches.length > 0 && currentTab === "group_stage" && currentView === "fecha" ? (
        <SurfaceCard
          title={selectedZoneCode ? `Fase de grupos · ${formatZoneLabel(selectedZoneCode)}` : "Fase de grupos"}
          description={tabDescription}
        >
          <PredictionBoard
            matches={currentTabZoneFilteredMatches}
            initialPredictions={predictions}
            currentUserId={currentUserId}
            isAuthenticated={Boolean(currentUserId)}
            participationActive={participationActive}
            compactClosedCards
          />
        </SurfaceCard>
      ) : null}

      {!dataNotice && matches.length > 0 && currentTab === "group_stage" && currentView === "zonas"
        ? orderedGroupCodes.map((groupCode) => (
            <SurfaceCard
              key={groupCode}
              title={groupCode === NO_ZONE_KEY ? "Partidos" : formatZoneLabel(groupCode)}
              description={
                groupCode === orderedGroupCodes[0]
                  ? tabDescription
                  : `${groupedMatches[groupCode]?.length ?? 0} partido${(groupedMatches[groupCode]?.length ?? 0) === 1 ? "" : "s"} cargado${(groupedMatches[groupCode]?.length ?? 0) === 1 ? "" : "s"}.`
              }
            >
              <PredictionBoard
                matches={groupedMatches[groupCode] ?? []}
                initialPredictions={predictions}
                currentUserId={currentUserId}
                isAuthenticated={Boolean(currentUserId)}
                participationActive={participationActive}
                compactClosedCards
                showAccessNotice={groupCode === orderedGroupCodes[0]}
              />
            </SurfaceCard>
          ))
        : null}

      {!dataNotice &&
      matches.length > 0 &&
      currentTab !== "upcoming" &&
      currentTab !== "group_stage" &&
      currentTab !== "specials" ? (
        <SurfaceCard title={selectedTabLabel} description={tabDescription}>
          <PredictionBoard
            matches={currentTabMatches}
            initialPredictions={predictions}
            currentUserId={currentUserId}
            isAuthenticated={Boolean(currentUserId)}
            participationActive={participationActive}
            compactClosedCards
          />
        </SurfaceCard>
      ) : null}

      {!dataNotice && matches.length > 0 && currentTab === "specials" ? (
        <SurfaceCard
          title="Especiales"
          description="Pronto vas a poder cargar campeón, subcampeón, goleador y otras predicciones especiales."
        >
          <div className="rounded-[1rem] border border-dashed border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4 text-sm leading-6 text-[var(--color-muted)]">
            Esta sección queda lista para la próxima etapa. Cuando habilitemos especiales, vas a ver tus picks acá sin perder el historial de partidos.
          </div>
        </SurfaceCard>
      ) : null}
    </PageStack>
  );
}
