import { getGroupCompetitionSnapshot } from "@/lib/groups/competition";
import { getPlayerDisplayName } from "@/lib/player/identity";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export type HomeCommunityMatch = {
  group: string;
  kickoff: string;
  home: {
    code: string;
    name: string;
    countryCode: string | null;
  };
  away: {
    code: string;
    name: string;
    countryCode: string | null;
  };
};

export type HomeCommunityIndividualRanking = {
  key: string;
  label: string;
  points: number;
  position: number;
};

export type HomeCommunityGroupRanking = {
  key: string;
  name: string;
  points: number;
  position: number;
  activeCount: number;
};

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

function getMatchDateKey(startsAt: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(startsAt));
}

async function getLandingMatches(): Promise<HomeCommunityMatch[]> {
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
      .limit(24);

    const mapped = ((data ?? []) as HomeMatchRow[])
      .map((match) => {
        const homeTeam = match.home_team?.[0];
        const awayTeam = match.away_team?.[0];

        if (!homeTeam || !awayTeam) {
          return null;
        }

        return {
          startsAt: match.starts_at,
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

    if (mapped.length === 0) {
      return [];
    }

    const nextDateKey = getMatchDateKey(mapped[0].startsAt);
    const sameDayMatches = mapped.filter((match) => getMatchDateKey(match.startsAt) === nextDateKey);
    const toPublicMatch = (match: (typeof mapped)[number]): HomeCommunityMatch => ({
      group: match.group,
      kickoff: match.kickoff,
      home: match.home,
      away: match.away,
    });

    if (sameDayMatches.length > 0) {
      return sameDayMatches.slice(0, 4).map(toPublicMatch);
    }

    return mapped.slice(0, 4).map(toPublicMatch);
  } catch {
    return [];
  }
}

async function getLandingRankings(): Promise<{
  individual: HomeCommunityIndividualRanking[];
  groups: HomeCommunityGroupRanking[];
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

    const individual: HomeCommunityIndividualRanking[] = rankingRows.map((row) => ({
      key: row.profile_id,
      label: getPlayerDisplayName(profileMap.get(row.profile_id) ?? null),
      points: row.points ?? 0,
      position: row.position,
    }));

    const groups: HomeCommunityGroupRanking[] = groupSnapshot.leaderboard.slice(0, 3).map((entry) => ({
      key: entry.groupId,
      name: entry.name,
      points: entry.teamScore,
      position: entry.position,
      activeCount: entry.activeCount,
    }));

    return { individual, groups };
  } catch {
    return { individual: [], groups: [] };
  }
}

export async function getHomeCommunityFeed() {
  const [matches, rankings] = await Promise.all([getLandingMatches(), getLandingRankings()]);

  return {
    matches,
    rankings,
  };
}
