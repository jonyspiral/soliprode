import { HomeHero } from "@/components/home/home-hero";
import { HomeMatchList, type HomeLandingMatch } from "@/components/home/home-match-list";
import { HomeRankingList, type HomeRankingEntry } from "@/components/home/home-ranking-list";
import { HomeStats } from "@/components/home/home-stats";
import { HomeSteps, type HomeLandingStep } from "@/components/home/home-steps";
import { getGroupCompetitionSnapshot } from "@/lib/groups/competition";
import type { HomeHeroState } from "@/lib/home/player-hero-state";
import { getPlayerDisplayName } from "@/lib/player/identity";
import { formatEntryPrice } from "@/lib/product/entry-config";
import { getHomeDisplayMetrics } from "@/lib/product/home-display";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

const LANDING_STEPS: readonly HomeLandingStep[] = [
  {
    step: "Paso 1",
    title: "Creás tu cuenta",
    description: "Entrás gratis, elegís tu alias y empezás a jugar sin pagar al registrarte.",
  },
  {
    step: "Paso 2",
    title: "Cargás tus pronósticos",
    description: "Guardás pronósticos como borrador y preparás tu torneo desde el celular.",
  },
  {
    step: "Paso 3",
    title: "Creá un equipo e invitá a tus amigos",
    description: "Pueden ganar la Copa y premios sorpresa.",
  },
  {
    step: "Paso 4",
    title: "Estate atento",
    description: "No te pierdas de cargar tus pronósticos antes de cada partido.",
  },
  {
    step: "Paso 5",
    title: "Activá tu cuenta",
    description:
      "Finalizá el proceso de inscripción para acceder a todas las funciones de SoliProde. Hoy por solo $5.000.",
  },
] as const;

type HomeMatchRow = {
  group_code: string | null;
  starts_at: string;
  home_team: {
    fifa_code: string | null;
    name: string;
    country_code: string | null;
  }[] | null;
  away_team: {
    fifa_code: string | null;
    name: string;
    country_code: string | null;
  }[] | null;
};

type HomeRankingRow = {
  profile_id: string;
  points: number | null;
  position: number | null;
};

type HomeProfileRow = {
  id: string;
  full_name: string | null;
  public_alias: string | null;
};

type HomeLandingProps = {
  entryPrice: number;
  heroState: HomeHeroState;
};

function formatLandingKickoff(startsAt: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(new Date(startsAt))
    .replace(",", " ·");
}

async function getLandingMatches(): Promise<HomeLandingMatch[]> {
  try {
    const service = createServiceRoleSupabaseClient();
    const { data } = await service
      .from("matches")
      .select(
        `
          group_code,
          starts_at,
          home_team:teams!matches_home_team_id_fkey(fifa_code, name, country_code),
          away_team:teams!matches_away_team_id_fkey(fifa_code, name, country_code)
        `,
      )
      .eq("status", "scheduled")
      .gt("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(3);

    return ((data ?? []) as HomeMatchRow[])
      .map((match) => {
        const homeTeam = match.home_team?.[0];
        const awayTeam = match.away_team?.[0];

        if (!homeTeam || !awayTeam) {
          return null;
        }

        return {
          group: match.group_code ?? "-",
          kickoff: formatLandingKickoff(match.starts_at),
          home: {
            code: homeTeam.fifa_code ?? homeTeam.name.slice(0, 3).toUpperCase(),
            name: homeTeam.name,
            countryCode: homeTeam.country_code,
          },
          away: {
            code: awayTeam.fifa_code ?? awayTeam.name.slice(0, 3).toUpperCase(),
            name: awayTeam.name,
            countryCode: awayTeam.country_code,
          },
        };
      })
      .filter((match): match is NonNullable<typeof match> => Boolean(match));
  } catch {
    return [];
  }
}

async function getLandingRankings(): Promise<{
  individual: HomeRankingEntry[];
  groups: HomeRankingEntry[];
}> {
  try {
    const service = createServiceRoleSupabaseClient();
    const [individualResult, groupSnapshot] = await Promise.all([
      service
        .from("rankings_cache")
        .select("profile_id, points, position")
        .eq("ranking_type", "general")
        .is("scope_id", null)
        .not("position", "is", null)
        .order("position", { ascending: true })
        .limit(3),
      getGroupCompetitionSnapshot(null),
    ]);

    const rankingRows = ((individualResult.data ?? []) as HomeRankingRow[]).filter(
      (row): row is HomeRankingRow & { position: number } => row.position !== null,
    );

    const profileIds = [...new Set(rankingRows.map((row) => row.profile_id))];
    const { data: profileData } =
      profileIds.length > 0
        ? await service.from("profiles").select("id, public_alias, full_name").in("id", profileIds)
        : { data: [] as HomeProfileRow[] };

    const profileMap = new Map(
      ((profileData ?? []) as HomeProfileRow[]).map((profile) => [profile.id, profile]),
    );

    const individual: HomeRankingEntry[] = rankingRows.map((row) => ({
      label: getPlayerDisplayName(profileMap.get(row.profile_id) ?? null),
      points: row.points ?? 0,
      position: row.position,
    }));

    const groups: HomeRankingEntry[] = groupSnapshot.leaderboard.slice(0, 3).map((entry) => ({
      label: entry.name,
      points: entry.teamScore,
      position: entry.position,
      detail: `${entry.activeCount} activos`,
    }));

    return { individual, groups };
  } catch {
    return { individual: [], groups: [] };
  }
}

export async function HomeLanding({ entryPrice, heroState }: HomeLandingProps) {
  const [homeDisplayMetrics, landingMatches, landingRankings] = await Promise.all([
    getHomeDisplayMetrics(),
    getLandingMatches(),
    getLandingRankings(),
  ]);

  return (
    <>
      <div className="home-landing-shell">
        <HomeHero entryPrice={formatEntryPrice(entryPrice)} state={heroState} />
        <HomeStats
          prizePoolLabel={homeDisplayMetrics.prizePoolLabel}
          playersLabel={homeDisplayMetrics.playersLabel}
        />
      </div>

      <div className="home-landing-sheet">
        <HomeRankingList
          title="Ranking individual"
          description="Top jugadores con puntaje oficial."
          entries={landingRankings.individual}
          emptyMessage="Todavía no hay ranking individual publicado."
        />

        <HomeRankingList
          title="Ranking grupal"
          description="Teams con mejor puntaje acumulado."
          entries={landingRankings.groups}
          emptyMessage="Todavía no hay ranking grupal publicado."
          tone="group"
        />

        <HomeMatchList matches={landingMatches} />
        <HomeSteps steps={LANDING_STEPS} />
      </div>
    </>
  );
}
