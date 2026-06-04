import { createServerSupabaseClient } from "@/lib/supabase/server";
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
  inviteCodePrefill: string;
  errorMessage: string | null;
  noticeMessage: string | null;
};

function readSearchValue(
  params: Record<string, string | string[] | undefined> | undefined,
  key: string,
) {
  const value = params?.[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
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

  try {
    const snapshot = await withSupabaseTimeout(
      getGroupCompetitionSnapshot(userId),
      "Supabase teams snapshot timed out",
    );
    const screenData =
      buildTeamsScreenDataFromSnapshot(snapshot) ??
      buildTeamsScreenFallbackData({
        authStatus: userId ? "member" : "guest",
        currentAlias: snapshot.currentUserAlias,
        currentParticipationStatus: snapshot.currentParticipationStatus,
        leaderboard: snapshot.leaderboard,
      });

    return {
      authStatus: userId ? "member" : "guest",
      hasCurrentTeam: Boolean(snapshot.currentGroup),
      currentAlias: snapshot.currentUserAlias,
      currentParticipationStatus: snapshot.currentParticipationStatus,
      screenData,
      inviteCodePrefill,
      errorMessage,
      noticeMessage,
    };
  } catch {
    errorMessage ??=
      "No pudimos cargar la tabla competitiva ahora. Reintentá en unos minutos.";

    return {
      authStatus: userId ? "member" : "guest",
      hasCurrentTeam: false,
      currentAlias: null,
      currentParticipationStatus: null,
      screenData: buildTeamsScreenFallbackData({
        authStatus: userId ? "member" : "guest",
        errorState: true,
      }),
      inviteCodePrefill,
      errorMessage,
      noticeMessage,
    };
  }
}
