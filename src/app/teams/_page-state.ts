import {
  createServerSupabaseClient,
  createServiceRoleSupabaseClient,
} from "@/lib/supabase/server";
import { withSupabaseTimeout } from "@/lib/supabase/timeouts";
import {
  getGroupCompetitionSnapshot,
  normalizeInviteCode,
} from "@/lib/groups/competition";
import {
  getTeamPassInviteByCode,
  getTeamPassSummaryForGroup,
} from "@/lib/team-passes/service";
import {
  countsForCaptainBonusProgress,
  formatCaptainBonusDeadline,
  isCaptainBonusParticipationStatus,
  resolveCaptainBonusStatus,
} from "@/lib/product/captain-bonus";
import type { TeamPassSummary } from "@/lib/team-passes/contracts";
import {
  buildTeamsScreenDataFromSnapshot,
  buildTeamsScreenFallbackData,
  type TeamsScreenData,
} from "@/app/teams/_screen-data";
import { getHomeDisplayMetrics, CURRENT_PRIZE_POOL_LABEL } from "@/lib/product/home-display";

type RawSearchParams =
  | Promise<Record<string, string | string[] | undefined> | undefined>
  | Record<string, string | string[] | undefined>
  | undefined;

export type TeamsPageState = {
  authStatus: "guest" | "member";
  hasCurrentTeam: boolean;
  currentAlias: string | null;
  currentParticipationStatus: string | null;
  screenData: TeamsScreenData;
  inviteContext: TeamInviteContext | null;
  teamPassInviteContext: TeamPassInviteContext | null;
  teamPassSummary: TeamPassSummary | null;
  captainBonusState: CaptainBonusState | null;
  inviteCodePrefill: string;
  teamPassCodePrefill: string;
  errorMessage: string | null;
  noticeMessage: string | null;
  prizePoolLabel: string;
};

export type CaptainBonusState = {
  activeMembers: number;
  deadlineLabel: string;
  missingMembers: number;
  requiredMembers: number;
  status: "pending" | "completed" | "expired";
  teamName: string;
};

export type TeamInviteContext = {
  code: string;
  targetGroupId: string | null;
  targetGroupName: string | null;
  status: "missing" | "ready" | "already-in-team" | "requires-confirmation";
  shouldAutoJoin: boolean;
};

export type TeamPassInviteContext = {
  code: string;
  targetGroupId: string | null;
  targetGroupName: string | null;
  status: "missing" | "ready" | "claimed" | "expired" | "already-paid";
  canClaim: boolean;
};

function readSearchValue(
  params: Record<string, string | string[] | undefined> | undefined,
  key: string,
) {
  const value = params?.[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

async function resolveInviteContext(params: {
  authStatus: "guest" | "member";
  currentGroupId: string | null;
  inviteCode: string;
}): Promise<TeamInviteContext | null> {
  if (!params.inviteCode) {
    return null;
  }

  const service = createServiceRoleSupabaseClient();
  const { data: targetGroup } = await service
    .from("groups")
    .select("id, name")
    .eq("invite_code", params.inviteCode)
    .maybeSingle();

  if (!targetGroup) {
    return {
      code: params.inviteCode,
      targetGroupId: null,
      targetGroupName: null,
      status: "missing",
      shouldAutoJoin: false,
    };
  }

  if (params.currentGroupId && params.currentGroupId === targetGroup.id) {
    return {
      code: params.inviteCode,
      targetGroupId: targetGroup.id,
      targetGroupName: targetGroup.name,
      status: "already-in-team",
      shouldAutoJoin: false,
    };
  }

  if (params.currentGroupId && params.currentGroupId !== targetGroup.id) {
    return {
      code: params.inviteCode,
      targetGroupId: targetGroup.id,
      targetGroupName: targetGroup.name,
      status: "requires-confirmation",
      shouldAutoJoin: false,
    };
  }

  return {
    code: params.inviteCode,
    targetGroupId: targetGroup.id,
    targetGroupName: targetGroup.name,
    status: "ready",
    shouldAutoJoin: params.authStatus === "member",
  };
}

async function resolveTeamPassInviteContext(params: {
  authStatus: "guest" | "member";
  currentParticipationStatus: string | null;
  inviteCode: string;
}) {
  if (!params.inviteCode) {
    return null;
  }

  const invite = await getTeamPassInviteByCode(params.inviteCode);

  if (!invite) {
    return {
      code: params.inviteCode,
      targetGroupId: null,
      targetGroupName: null,
      status: "missing",
      canClaim: false,
    } satisfies TeamPassInviteContext;
  }

  const service = createServiceRoleSupabaseClient();
  const { data: group } = await service
    .from("groups")
    .select("id, name")
    .eq("id", invite.team_id)
    .maybeSingle();

  if (invite.status === "claimed") {
    return {
      code: invite.code,
      targetGroupId: invite.team_id,
      targetGroupName: group?.name ?? "Team",
      status: "claimed",
      canClaim: false,
    } satisfies TeamPassInviteContext;
  }

  if (invite.expires_at && new Date(invite.expires_at).getTime() <= Date.now()) {
    return {
      code: invite.code,
      targetGroupId: invite.team_id,
      targetGroupName: group?.name ?? "Team",
      status: "expired",
      canClaim: false,
    } satisfies TeamPassInviteContext;
  }

  if (params.currentParticipationStatus === "paid") {
    return {
      code: invite.code,
      targetGroupId: invite.team_id,
      targetGroupName: group?.name ?? "Team",
      status: "already-paid",
      canClaim: false,
    } satisfies TeamPassInviteContext;
  }

  return {
    code: invite.code,
    targetGroupId: invite.team_id,
    targetGroupName: group?.name ?? "Team",
    status: "ready",
    canClaim: params.authStatus === "member",
  } satisfies TeamPassInviteContext;
}

export async function getTeamsPageState(searchParams?: RawSearchParams): Promise<TeamsPageState> {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const inviteCodePrefill = normalizeInviteCode(readSearchValue(resolvedSearchParams, "code"));
  const teamPassCodePrefill = normalizeInviteCode(readSearchValue(resolvedSearchParams, "slot"));
  let errorMessage = readSearchValue(resolvedSearchParams, "error") || null;
  const noticeMessage = readSearchValue(resolvedSearchParams, "notice") || null;

  let userId: string | null = null;

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await withSupabaseTimeout(supabase.auth.getUser(), "Supabase session check timed out");

    userId = user?.id ?? null;
  } catch {
    errorMessage ??=
      "No pudimos revisar tu Team ahora. Reintentá en unos minutos.";
  }

  const authStatus = userId ? "member" : "guest";
  const homeDisplayMetrics = await getHomeDisplayMetrics().catch(() => null);
  const prizePoolLabel = homeDisplayMetrics?.prizePoolLabel ?? CURRENT_PRIZE_POOL_LABEL;

  try {
    const snapshot = await withSupabaseTimeout(
      getGroupCompetitionSnapshot(userId),
      "Supabase teams snapshot timed out",
    );
    const screenData =
      buildTeamsScreenDataFromSnapshot(snapshot) ??
      buildTeamsScreenFallbackData({
        authStatus,
        currentAlias: snapshot.currentUserAlias,
        currentParticipationStatus: snapshot.currentParticipationStatus,
        leaderboard: snapshot.leaderboard,
      });
    const inviteContext = await resolveInviteContext({
      authStatus,
      currentGroupId: snapshot.currentGroup?.groupId ?? null,
      inviteCode: inviteCodePrefill,
    });
    const teamPassInviteContext = await resolveTeamPassInviteContext({
      authStatus,
      currentParticipationStatus: snapshot.currentParticipationStatus,
      inviteCode: teamPassCodePrefill,
    });
    const teamPassSummary = snapshot.currentGroup
      ? await getTeamPassSummaryForGroup({
          teamId: snapshot.currentGroup.groupId,
          activePlayers: snapshot.currentGroup.activeCount,
        })
      : null;
    const captainBonusState =
      userId &&
      snapshot.currentGroup &&
      snapshot.currentGroup.ownerProfileId === userId &&
      isCaptainBonusParticipationStatus(snapshot.currentParticipationStatus)
        ? (() => {
            const activeMembers = snapshot.currentGroup.members.filter((member) =>
              countsForCaptainBonusProgress(member.paymentStatus),
            ).length;
            const status = resolveCaptainBonusStatus({
              activeMembers,
            });

            return {
              activeMembers,
              deadlineLabel: formatCaptainBonusDeadline(),
              missingMembers: status.missingMembers,
              requiredMembers: status.requiredMembers,
              status: status.status,
              teamName: snapshot.currentGroup.name,
            } satisfies CaptainBonusState;
          })()
        : null;

    return {
      authStatus,
      hasCurrentTeam: Boolean(snapshot.currentGroup),
      currentAlias: snapshot.currentUserAlias,
      currentParticipationStatus: snapshot.currentParticipationStatus,
      screenData,
      inviteContext,
      teamPassInviteContext,
      teamPassSummary,
      captainBonusState,
      inviteCodePrefill,
      teamPassCodePrefill,
      errorMessage,
      noticeMessage,
      prizePoolLabel,
    };
  } catch {
    errorMessage ??=
      "No pudimos cargar la tabla competitiva ahora. Reintentá en unos minutos.";

    return {
      authStatus,
      hasCurrentTeam: false,
      currentAlias: null,
      currentParticipationStatus: null,
      screenData: buildTeamsScreenFallbackData({
        authStatus,
        errorState: true,
      }),
      inviteContext: await resolveInviteContext({
        authStatus,
        currentGroupId: null,
        inviteCode: inviteCodePrefill,
      }),
      teamPassInviteContext: await resolveTeamPassInviteContext({
        authStatus,
        currentParticipationStatus: null,
        inviteCode: teamPassCodePrefill,
      }),
      teamPassSummary: null,
      captainBonusState: null,
      inviteCodePrefill,
      teamPassCodePrefill,
      errorMessage,
      noticeMessage,
      prizePoolLabel,
    };
  }
}
