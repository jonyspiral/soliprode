import { InfoNotice, PageStack } from "@/components/placeholder-primitives";
import { RankingsScreen } from "@/components/rankings/rankings-screen";
import { getAuthAvatarMap } from "@/lib/player/avatar-directory";
import { getGroupCompetitionSnapshot, type GroupLeaderboardEntry } from "@/lib/groups/competition";
import {
  getParticipationStatus,
  getPlayerAvatar,
  getPlayerDisplayName,
} from "@/lib/player/identity";
import { pickPrimaryParticipation } from "@/lib/participations/primary";
import {
  createServerSupabaseClient,
  createServiceRoleSupabaseClient,
} from "@/lib/supabase/server";
import { withSupabaseTimeout } from "@/lib/supabase/timeouts";

type RankingRow = {
  profile_id: string;
  points: number;
  position: number | null;
  updated_at: string;
};

type ParticipationRow = {
  created_at: string;
  group_id: string | null;
  payment_status: string;
  profile_id: string;
};

type ProfileRow = {
  full_name: string | null;
  id: string;
  public_alias: string | null;
};

type GroupRow = {
  id: string;
  name: string;
};

type IndividualLeaderboardEntry = {
  avatarUrl: string | null;
  isCurrentUser: boolean;
  points: number;
  position: number;
  profileId: string;
  teamName: string | null;
  userLabel: string;
};

function formatShortPoints(points: number) {
  return `${points.toLocaleString("es-AR")} pts`;
}

function formatOrdinal(position: number) {
  return `${position}º`;
}

function formatPositionLabel(position: number | null, provisional: boolean) {
  if (!position) {
    return provisional ? "1º prov." : "--";
  }

  return provisional ? `${formatOrdinal(position)} prov.` : `#${position}`;
}

function formatUpdatedDate(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString("es-AR");
}

function buildPrimaryParticipationMap(rows: ParticipationRow[]) {
  const rowsByProfile = new Map<string, ParticipationRow[]>();

  for (const row of rows) {
    const list = rowsByProfile.get(row.profile_id) ?? [];
    list.push(row);
    rowsByProfile.set(row.profile_id, list);
  }

  const primaryByProfile = new Map<string, ParticipationRow>();

  for (const [profileId, participations] of rowsByProfile.entries()) {
    const primary = pickPrimaryParticipation(participations).participation;

    if (primary) {
      primaryByProfile.set(profileId, primary);
    }
  }

  return primaryByProfile;
}

function dedupeRankingRows(rows: RankingRow[]) {
  const bestByProfile = new Map<string, RankingRow>();

  for (const row of rows) {
    const current = bestByProfile.get(row.profile_id);

    if (!current) {
      bestByProfile.set(row.profile_id, row);
      continue;
    }

    const currentPosition = current.position ?? Number.MAX_SAFE_INTEGER;
    const nextPosition = row.position ?? Number.MAX_SAFE_INTEGER;

    if (nextPosition < currentPosition || (nextPosition === currentPosition && row.points > current.points)) {
      bestByProfile.set(row.profile_id, row);
    }
  }

  return [...bestByProfile.values()]
    .sort((a, b) => {
      const positionDelta = (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER);

      if (positionDelta !== 0) {
        return positionDelta;
      }

      return b.points - a.points;
    })
    .slice(0, 10);
}

export default async function RankingsPage() {
  const supabase = await createServerSupabaseClient();
  const service = createServiceRoleSupabaseClient();

  let currentUserId: string | null = null;
  let currentUserAlias = "Jugador";
  let currentUserAvatarUrl: string | null = null;
  let individualRows: IndividualLeaderboardEntry[] = [];
  let teamRows: GroupLeaderboardEntry[] = [];
  let currentUserRanking: IndividualLeaderboardEntry | null = null;
  let currentGroup: GroupLeaderboardEntry | null = null;
  let participationStatus: string | null = null;
  let updatedAt: string | null = null;
  let notice: string | null = null;

  try {
    const {
      data: { user },
    } = await withSupabaseTimeout(supabase.auth.getUser(), "Supabase session check timed out");

    currentUserId = user?.id ?? null;

    const topRankingsQuery = service
      .from("rankings_cache")
      .select("profile_id, points, position, updated_at")
      .eq("ranking_type", "general")
      .is("scope_id", null)
      .not("position", "is", null)
      .order("position", { ascending: true })
      .limit(20);

    const currentUserRankingQuery = currentUserId
      ? service
          .from("rankings_cache")
          .select("profile_id, points, position, updated_at")
          .eq("ranking_type", "general")
          .is("scope_id", null)
          .eq("profile_id", currentUserId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null });

    const participationsQuery = service
      .from("participations")
      .select("profile_id, group_id, payment_status, created_at");

    const [
      { data: topRankingData },
      { data: currentUserRankingData },
      { data: participationData },
      groupSnapshot,
    ] = await withSupabaseTimeout(
      Promise.all([
        topRankingsQuery,
        currentUserRankingQuery,
        participationsQuery,
        getGroupCompetitionSnapshot(currentUserId),
      ]),
      "Supabase rankings query timed out",
    );

    const topRankings = dedupeRankingRows((topRankingData ?? []) as RankingRow[]);
    const rawCurrentUserRanking = (currentUserRankingData as RankingRow | null) ?? null;
    const participations = (participationData ?? []) as ParticipationRow[];
    const primaryParticipations = buildPrimaryParticipationMap(participations);
    const activeProfileIds = [...new Set(
      [...primaryParticipations.values()]
        .filter((row) => row.payment_status === "paid")
        .map((row) => row.profile_id),
    )];

    participationStatus = groupSnapshot.currentParticipationStatus ?? null;
    teamRows = groupSnapshot.leaderboard.slice(0, 10);
    currentGroup = groupSnapshot.currentGroup;

    const profileIdsToLoad = [
      ...new Set(
        [
          ...activeProfileIds,
          ...topRankings.map((row) => row.profile_id),
          rawCurrentUserRanking?.profile_id ?? null,
          currentUserId,
        ].filter((value): value is string => Boolean(value)),
      ),
    ];

    const groupIdsToLoad = [
      ...new Set(
        [...primaryParticipations.values()]
          .map((row) => row.group_id)
          .filter((value): value is string => Boolean(value)),
      ),
    ];

    const [{ data: profileData }, { data: groupData }] = await withSupabaseTimeout(
      Promise.all([
        profileIdsToLoad.length > 0
          ? service
              .from("profiles")
              .select("id, public_alias, full_name")
              .in("id", profileIdsToLoad)
          : Promise.resolve({ data: [] }),
        groupIdsToLoad.length > 0
          ? service.from("groups").select("id, name").in("id", groupIdsToLoad)
          : Promise.resolve({ data: [] }),
      ]),
      "Supabase ranking profile query timed out",
    );

    const profiles = (profileData ?? []) as ProfileRow[];
    const groups = (groupData ?? []) as GroupRow[];
    const avatarMap = await getAuthAvatarMap(profileIdsToLoad);
    const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
    const groupMap = new Map(groups.map((group) => [group.id, group.name]));

    const currentProfile = currentUserId ? profileMap.get(currentUserId) ?? null : null;
    currentUserAlias = getPlayerDisplayName(currentProfile, user ? { user_metadata: user.user_metadata } : null);
    currentUserAvatarUrl = getPlayerAvatar(currentProfile, user ? { user_metadata: user.user_metadata } : null);

    updatedAt = topRankings[0]?.updated_at ?? rawCurrentUserRanking?.updated_at ?? null;

    if (topRankings.length > 0) {
      individualRows = topRankings
        .filter((row) => row.position !== null)
        .map((row) => {
          const profile = profileMap.get(row.profile_id) ?? null;
          const participation = primaryParticipations.get(row.profile_id) ?? null;
          const alias = row.profile_id === currentUserId ? currentUserAlias : getPlayerDisplayName(profile);
          const avatarUrl =
            row.profile_id === currentUserId
              ? currentUserAvatarUrl ?? avatarMap.get(row.profile_id) ?? getPlayerAvatar(profile)
              : avatarMap.get(row.profile_id) ?? getPlayerAvatar(profile);

          return {
            avatarUrl,
            isCurrentUser: row.profile_id === currentUserId,
            points: row.points ?? 0,
            position: row.position ?? 0,
            profileId: row.profile_id,
            teamName: participation?.group_id ? groupMap.get(participation.group_id) ?? null : null,
            userLabel: alias,
          };
        })
        .slice(0, 10);
    } else {
      individualRows = activeProfileIds
        .map((profileId) => {
          const profile = profileMap.get(profileId) ?? null;
          const participation = primaryParticipations.get(profileId) ?? null;

          return {
            avatarUrl:
              profileId === currentUserId
                ? currentUserAvatarUrl ?? avatarMap.get(profileId) ?? getPlayerAvatar(profile)
                : avatarMap.get(profileId) ?? getPlayerAvatar(profile),
            isCurrentUser: profileId === currentUserId,
            points: 0,
            position: 0,
            profileId,
            teamName: participation?.group_id ? groupMap.get(participation.group_id) ?? null : null,
            userLabel: profileId === currentUserId ? currentUserAlias : getPlayerDisplayName(profile),
          };
        })
        .sort((a, b) => a.userLabel.localeCompare(b.userLabel, "es"))
        .slice(0, 10)
        .map((entry, index) => ({
          ...entry,
          position: index + 1,
        }));
    }

    currentUserRanking =
      individualRows.find((row) => row.profileId === currentUserId) ??
      (rawCurrentUserRanking?.position
        ? (() => {
            const profile = profileMap.get(rawCurrentUserRanking.profile_id) ?? null;
            const participation = primaryParticipations.get(rawCurrentUserRanking.profile_id) ?? null;

            return {
              avatarUrl:
                rawCurrentUserRanking.profile_id === currentUserId
                  ? currentUserAvatarUrl ?? avatarMap.get(rawCurrentUserRanking.profile_id) ?? getPlayerAvatar(profile)
                  : avatarMap.get(rawCurrentUserRanking.profile_id) ?? getPlayerAvatar(profile),
              isCurrentUser: rawCurrentUserRanking.profile_id === currentUserId,
              points: rawCurrentUserRanking.points ?? 0,
              position: rawCurrentUserRanking.position ?? 0,
              profileId: rawCurrentUserRanking.profile_id,
              teamName: participation?.group_id ? groupMap.get(participation.group_id) ?? null : null,
              userLabel:
                rawCurrentUserRanking.profile_id === currentUserId
                  ? currentUserAlias
                  : getPlayerDisplayName(profile),
            };
          })()
        : null);

    if (individualRows.length === 0 && teamRows.length === 0) {
      notice =
        "Todavía no hay ranking calculado. Cuando entren Jugadores activos y resultados oficiales, esta pantalla va a tomar ritmo.";
    }
  } catch {
    notice = "No pudimos cargar el ranking oficial en este momento. Reintentá en unos minutos.";
  }

  const isCurrentUserActive = participationStatus === "paid";
  const hasComputedResults =
    individualRows.some((row) => row.points > 0) || teamRows.some((entry) => entry.teamScore > 0);
  const individualPodium = individualRows.slice(0, 3).map((row) => ({
    key: row.profileId,
    label: row.userLabel,
    points: row.points,
    position: row.position,
    avatarUrl: row.avatarUrl,
    isCurrent: row.isCurrentUser,
  }));
  const teamPodium = teamRows.slice(0, 3).map((entry) => ({
    key: entry.groupId,
    name: entry.name,
    points: entry.teamScore,
    position: entry.position,
    activeCount: entry.activeCount,
    isCurrent: currentGroup?.groupId === entry.groupId,
  }));
  const updatedLabel = formatUpdatedDate(updatedAt);
  const individualPositionLabel = formatPositionLabel(currentUserRanking?.position ?? null, !hasComputedResults);
  const teamPositionDetail = currentGroup
    ? `${formatPositionLabel(currentGroup.position, !hasComputedResults)} · ${formatShortPoints(
        currentGroup.teamScore,
      )} · ${currentGroup.activeCount} jugador${currentGroup.activeCount === 1 ? "" : "es"} activos`
    : "Sin Team · Sumate para competir";

  return (
    <PageStack>
      {notice ? <InfoNotice message={notice} tone="info" /> : null}
      <RankingsScreen
        hasComputedResults={hasComputedResults}
        individualPodium={individualPodium}
        individualPositionLabel={individualPositionLabel}
        individualRows={individualRows}
        individualStatusLabel={getParticipationStatus(participationStatus)}
        individualUserPoints={formatShortPoints(currentUserRanking?.points ?? 0)}
        isCurrentUserActive={isCurrentUserActive}
        teamCtaHref="/groups"
        teamPodium={teamPodium}
        teamPositionDetail={teamPositionDetail}
        teamPositionLabel={currentGroup?.name ?? "Sin Team"}
        teamRows={teamRows.map((entry) => ({
          activeCount: entry.activeCount,
          isCurrentTeam: currentGroup?.groupId === entry.groupId,
          name: entry.name,
          points: entry.teamScore,
          position: entry.position,
          teamId: entry.groupId,
        }))}
        updatedLabel={updatedLabel}
      />
    </PageStack>
  );
}
