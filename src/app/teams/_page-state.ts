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
  buildTeamsScreenDataFromSnapshot,
  buildTeamsScreenFallbackData,
  type TeamsScreenData,
} from "@/app/teams/_screen-data";

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
  inviteCodePrefill: string;
  errorMessage: string | null;
  noticeMessage: string | null;
};

export type TeamInviteContext = {
  code: string;
  targetGroupId: string | null;
  targetGroupName: string | null;
  status: "missing" | "ready" | "already-in-team" | "requires-confirmation";
  shouldAutoJoin: boolean;
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

export async function getTeamsPageState(searchParams?: RawSearchParams): Promise<TeamsPageState> {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const inviteCodePrefill = normalizeInviteCode(readSearchValue(resolvedSearchParams, "code"));
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

    return {
      authStatus,
      hasCurrentTeam: Boolean(snapshot.currentGroup),
      currentAlias: snapshot.currentUserAlias,
      currentParticipationStatus: snapshot.currentParticipationStatus,
      screenData,
      inviteContext,
      inviteCodePrefill,
      errorMessage,
      noticeMessage,
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
      inviteCodePrefill,
      errorMessage,
      noticeMessage,
    };
  }
}
