import { getAuthAvatarMap } from "@/lib/player/avatar-directory";
import { getGroupAvatarModel } from "@/lib/groups/identity";
import { getTeamMinActivePlayers, getTeamScoringMaxPlayers } from "@/lib/competition/settings";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { getPlayerAvatarModel, getPlayerDisplayName } from "@/lib/player/identity";
import { pickPrimaryParticipation } from "@/lib/participations/primary";

type ParticipationRow = {
  created_at: string;
  profile_id: string;
  group_id: string | null;
  payment_status: string;
};

type GroupRow = {
  avatar_seed: string | null;
  avatar_url: string | null;
  avatar_variant: string | null;
  id: string;
  name: string;
  slug: string;
  invite_code: string | null;
  owner_profile_id: string | null;
};

type ProfileRow = {
  avatar_seed: string | null;
  avatar_url: string | null;
  avatar_variant: string | null;
  id: string;
  full_name: string | null;
  public_alias: string | null;
};

type RankingRow = {
  profile_id: string;
  points: number;
  position: number | null;
};

export type GroupMemberSnapshot = {
  avatarSeed: string;
  avatarUrl: string | null;
  avatarVariant: string | null;
  fallbackAvatarUrl: string | null;
  profileId: string;
  alias: string;
  paymentStatus: string;
  points: number;
  generalPosition: number | null;
  groupPosition: number | null;
  isActive: boolean;
  isCurrentUser: boolean;
};

export type GroupLeaderboardEntry = {
  avatarChoice: string | null;
  groupId: string;
  avatarSeed: string;
  avatarUrl: string | null;
  avatarVariant: string | null;
  fallbackAvatarUrl: string | null;
  name: string;
  slug: string;
  inviteCode: string | null;
  ownerProfileId: string | null;
  activeCount: number;
  totalCount: number;
  teamScore: number;
  isEligible: boolean;
  position: number;
  dtProfileId: string | null;
  dtAlias: string | null;
  dtAvatarUrl: string | null;
};

export type CurrentGroupSnapshot = GroupLeaderboardEntry & {
  members: GroupMemberSnapshot[];
};

export type GroupCompetitionSnapshot = {
  currentGroup: CurrentGroupSnapshot | null;
  currentParticipationStatus: string | null;
  currentUserAlias: string | null;
  currentUserAvatarUrl: string | null;
  leaderboard: GroupLeaderboardEntry[];
};

function normalizeAlias(alias: string | null | undefined, fallback: string) {
  return typeof alias === "string" && alias.trim() ? alias.trim() : fallback;
}

function isParticipationActive(paymentStatus: string) {
  return paymentStatus === "paid";
}

function compareMembers(a: GroupMemberSnapshot, b: GroupMemberSnapshot) {
  if (b.points !== a.points) {
    return b.points - a.points;
  }

  return a.alias.localeCompare(b.alias, "es");
}

export function normalizeInviteCode(rawValue: string) {
  return rawValue.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export async function getGroupCompetitionSnapshot(
  currentUserId: string | null,
): Promise<GroupCompetitionSnapshot> {
  const service = createServiceRoleSupabaseClient();
  const teamMinActivePlayers = getTeamMinActivePlayers();
  const teamScoringMaxPlayers = getTeamScoringMaxPlayers();

  const currentParticipationQuery = currentUserId
    ? service
        .from("participations")
        .select("profile_id, group_id, payment_status, created_at")
        .eq("profile_id", currentUserId)
        .order("created_at", { ascending: false })
        .limit(10)
    : Promise.resolve({ data: null, error: null });

  const currentProfileQuery = currentUserId
    ? service
        .from("profiles")
        .select("id, public_alias, full_name, avatar_url, avatar_seed, avatar_variant")
        .eq("id", currentUserId)
        .maybeSingle()
    : Promise.resolve({ data: null, error: null });

  const groupedParticipationsQuery = service
    .from("participations")
    .select("profile_id, group_id, payment_status")
    .not("group_id", "is", null);

  const [
    { data: currentParticipationData },
    { data: currentProfileData },
    { data: groupedParticipationsData },
  ] = await Promise.all([
    currentParticipationQuery,
    currentProfileQuery,
    groupedParticipationsQuery,
  ]);

  const currentParticipation =
    pickPrimaryParticipation((currentParticipationData ?? []) as ParticipationRow[]).participation;
  const groupedParticipations = (groupedParticipationsData ?? []) as ParticipationRow[];

  if (groupedParticipations.length === 0) {
    return {
      currentGroup: null,
      currentParticipationStatus: currentParticipation?.payment_status ?? null,
      currentUserAlias: getPlayerDisplayName((currentProfileData as ProfileRow | null) ?? null),
      currentUserAvatarUrl: null,
      leaderboard: [],
    };
  }

  const groupIds = [...new Set(groupedParticipations.map((row) => row.group_id).filter(Boolean))] as string[];
  const profileIds = [...new Set(groupedParticipations.map((row) => row.profile_id))];

  const [groupsResult, profilesResult, rankingsResult] = await Promise.all([
    service
      .from("groups")
      .select("id, name, slug, invite_code, owner_profile_id, avatar_url, avatar_seed, avatar_variant")
      .in("id", groupIds),
    service
      .from("profiles")
      .select("id, public_alias, full_name, avatar_url, avatar_seed, avatar_variant")
      .in("id", profileIds),
    service
      .from("rankings_cache")
      .select("profile_id, points, position")
      .eq("ranking_type", "general")
      .is("scope_id", null)
      .in("profile_id", profileIds),
  ]);

  const groups = (groupsResult.data ?? []) as GroupRow[];
  const profiles = (profilesResult.data ?? []) as ProfileRow[];
  const rankings = (rankingsResult.data ?? []) as RankingRow[];
  const avatarMap = await getAuthAvatarMap(
    [...new Set([...(currentUserId ? [currentUserId] : []), ...profileIds])],
  );

  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  const rankingMap = new Map(rankings.map((ranking) => [ranking.profile_id, ranking]));
  const membersByGroup = new Map<string, GroupMemberSnapshot[]>();

  for (const participation of groupedParticipations) {
    if (!participation.group_id) {
      continue;
    }

    const profile = profileMap.get(participation.profile_id);
    const ranking = rankingMap.get(participation.profile_id);
    const playerAvatar = getPlayerAvatarModel(profile ?? null, {
      id: participation.profile_id,
      user_metadata: {
        avatar_url: avatarMap.get(participation.profile_id) ?? null,
      },
    });
    const member: GroupMemberSnapshot = {
      avatarSeed: playerAvatar.avatarSeed,
      avatarUrl: playerAvatar.avatarUrl,
      avatarVariant: playerAvatar.avatarVariant,
      fallbackAvatarUrl: playerAvatar.fallbackAvatarUrl,
      profileId: participation.profile_id,
      alias: normalizeAlias(
        getPlayerDisplayName(profile),
        `Jugador ${participation.profile_id.slice(0, 4)}`,
      ),
      paymentStatus: participation.payment_status,
      points: ranking?.points ?? 0,
      generalPosition: ranking?.position ?? null,
      groupPosition: null,
      isActive: isParticipationActive(participation.payment_status),
      isCurrentUser: currentUserId === participation.profile_id,
    };

    const existingMembers = membersByGroup.get(participation.group_id) ?? [];
    existingMembers.push(member);
    membersByGroup.set(participation.group_id, existingMembers);
  }

  const leaderboard: CurrentGroupSnapshot[] = groups
    .map((group) => {
      const members = [...(membersByGroup.get(group.id) ?? [])];
      const activeMembers = members.filter((member) => member.isActive).sort(compareMembers);

      activeMembers.forEach((member, index) => {
        member.groupPosition = index + 1;
      });

      members.sort((a, b) => {
        if (a.isActive !== b.isActive) {
          return a.isActive ? -1 : 1;
        }

        return compareMembers(a, b);
      });

      const starters = activeMembers.slice(0, teamScoringMaxPlayers);
      const teamScore = starters.reduce((sum, member) => sum + member.points, 0);
      const isEligible = activeMembers.length >= teamMinActivePlayers;
      const groupAvatar = getGroupAvatarModel(group);

      return {
        avatarChoice: groupAvatar.currentAvatarChoice,
        groupId: group.id,
        avatarSeed: groupAvatar.avatarSeed,
        avatarUrl: groupAvatar.avatarUrl,
        avatarVariant: groupAvatar.avatarVariant,
        fallbackAvatarUrl: groupAvatar.fallbackAvatarUrl,
        name: group.name,
        slug: group.slug,
        inviteCode: group.invite_code,
        ownerProfileId: group.owner_profile_id,
        activeCount: activeMembers.length,
        totalCount: members.length,
        teamScore,
        isEligible,
        position: 0,
        dtProfileId: activeMembers[0]?.profileId ?? null,
        dtAlias: activeMembers[0]?.alias ?? null,
        dtAvatarUrl: activeMembers[0]?.avatarUrl ?? null,
        members,
      };
    })
    .sort((a, b) => {
      if (b.teamScore !== a.teamScore) {
        return b.teamScore - a.teamScore;
      }

      if (b.activeCount !== a.activeCount) {
        return b.activeCount - a.activeCount;
      }

      if (b.totalCount !== a.totalCount) {
        return b.totalCount - a.totalCount;
      }

      return a.name.localeCompare(b.name, "es");
    })
    .map((entry, index) => ({
      ...entry,
      position: index + 1,
    }));

  const currentGroupId = currentParticipation?.group_id ?? null;
  const currentGroupEntry = currentGroupId
    ? leaderboard.find((entry) => entry.groupId === currentGroupId) ?? null
    : null;

  return {
    currentGroup: currentGroupEntry,
    currentParticipationStatus: currentParticipation?.payment_status ?? null,
    currentUserAlias: getPlayerDisplayName((currentProfileData as ProfileRow | null) ?? null),
    currentUserAvatarUrl: currentUserId
      ? getPlayerAvatarModel((currentProfileData as ProfileRow | null) ?? null, {
          id: currentUserId,
          user_metadata: {
            avatar_url: avatarMap.get(currentUserId) ?? null,
          },
        }).avatarUrl
      : null,
    leaderboard: leaderboard.map((entry) => ({
      avatarChoice: entry.avatarChoice,
      groupId: entry.groupId,
      avatarSeed: entry.avatarSeed,
      avatarUrl: entry.avatarUrl,
      avatarVariant: entry.avatarVariant,
      fallbackAvatarUrl: entry.fallbackAvatarUrl,
      name: entry.name,
      slug: entry.slug,
      inviteCode: entry.inviteCode,
      ownerProfileId: entry.ownerProfileId,
      activeCount: entry.activeCount,
      totalCount: entry.totalCount,
      teamScore: entry.teamScore,
      isEligible: entry.isEligible,
      position: entry.position,
      dtProfileId: entry.dtProfileId,
      dtAlias: entry.dtAlias,
      dtAvatarUrl: entry.dtAvatarUrl,
    })),
  };
}
