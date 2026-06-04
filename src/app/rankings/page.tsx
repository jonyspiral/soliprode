import Link from "next/link";
import { InfoNotice, PageStack } from "@/components/placeholder-primitives";
import { TeamIcon } from "@/components/app-icons";
import { PlayerAvatar } from "@/components/profile/player-avatar";
import { RankingPodiumBlocks } from "@/components/rankings/ranking-podium-blocks";
import { getAuthAvatarMap } from "@/lib/player/avatar-directory";
import { SurfaceCard } from "@/components/surface-card";
import { getGroupCompetitionSnapshot, type GroupLeaderboardEntry } from "@/lib/groups/competition";
import {
  getParticipationStatus,
  getPlayerAvatar,
  getPlayerDisplayName,
  getPlayerInitials,
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
  return `${position}Âº`;
}

function formatPositionLabel(position: number | null, provisional: boolean) {
  if (!position) {
    return provisional ? "1Âº prov." : "--";
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

function buildTeamInitials(name: string) {
  const cleaned = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);

  return cleaned || "TM";
}

function renderBadge(label: string, tone: "blue" | "gold" = "blue") {
  const toneClass =
    tone === "gold"
      ? "border-[var(--color-gold)]/60 bg-[rgba(255,225,109,0.18)] text-[var(--color-ink)]"
      : "border-[var(--color-secondary)]/25 bg-[rgba(154,225,255,0.2)] text-[var(--color-secondary)]";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${toneClass}`}
    >
      {label}
    </span>
  );
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
      .limit(10);

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

    const topRankings = (topRankingData ?? []) as RankingRow[];
    const rawCurrentUserRanking = (currentUserRankingData as RankingRow | null) ?? null;
    const participations = (participationData ?? []) as ParticipationRow[];
    const primaryParticipations = buildPrimaryParticipationMap(participations);
    const activeProfileIds = [...primaryParticipations.values()]
      .filter((row) => row.payment_status === "paid")
      .map((row) => row.profile_id);

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
        });
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
        "TodavÃ­a no hay ranking calculado. Cuando entren Jugadores activos y resultados oficiales, esta pantalla va a tomar ritmo.";
    }
  } catch {
    notice = "No pudimos cargar el ranking oficial en este momento. ReintentÃ¡ en unos minutos.";
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
  const teamPositionLabel = currentGroup
    ? formatPositionLabel(currentGroup.position, !hasComputedResults)
    : "Sin Team";

  return (
    <PageStack>
      <section className="overflow-hidden rounded-[1.25rem] bg-[linear-gradient(180deg,#0047ab_0%,#00327d_100%)] p-5 text-white shadow-[0_16px_32px_rgba(0,50,125,0.18)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center rounded-sm bg-[var(--color-gold)] px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink)]">
              Oficial
            </span>
            <h1 className="mt-3 font-serif text-[2.15rem] font-bold uppercase leading-none tracking-[-0.03em]">
              Rankings oficiales
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#dfe6ff]">
              Individual y Teams
              {updatedLabel ? ` Â· Actualizado ${updatedLabel}` : " Â· Ranking provisional"}
            </p>
          </div>
          <div className="pointer-events-none hidden h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/5 md:flex">
            <div className="grid grid-cols-3 items-end gap-1.5 opacity-80">
              <span className="h-7 w-3 rounded-sm bg-white/15" />
              <span className="h-12 w-3 rounded-sm bg-white/20" />
              <span className="h-9 w-3 rounded-sm bg-white/15" />
            </div>
          </div>
        </div>
      </section>

      {notice ? <InfoNotice message={notice} tone="info" /> : null}

      {!isCurrentUserActive ? (
        <InfoNotice
          message="Los jugadores pendientes quedan afuera hasta activar su Pase Solidario."
          tone="error"
        />
      ) : null}

      <section className="grid grid-cols-2 gap-3">
        <SurfaceCard className="rounded-[1rem] p-0 shadow-sm">
          <div className="flex items-start justify-between gap-3 p-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                Individual
              </p>
              <p className="mt-2 font-serif text-[2rem] font-bold leading-none text-[var(--color-primary)]">
                {individualPositionLabel}
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">
                {formatShortPoints(currentUserRanking?.points ?? 0)}
              </p>
              <div className="mt-3">{renderBadge(getParticipationStatus(participationStatus))}</div>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface-muted)] text-[var(--color-primary)]">
              <span className="text-sm font-bold">#</span>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard className="rounded-[1rem] p-0 shadow-sm">
          <div className="flex h-full flex-col justify-between p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                  Team
                </p>
                <p className="mt-2 font-serif text-[1.55rem] font-bold leading-none text-[var(--color-primary)]">
                  {currentGroup?.name ?? "Sin Team"}
                </p>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  {currentGroup
                    ? `${formatShortPoints(currentGroup.teamScore)} Â· ${currentGroup.activeCount} jugador${
                        currentGroup.activeCount === 1 ? "" : "es"
                      } activos`
                    : "Sumate a un Team para competir en dupla con tu Plantel."}
                </p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface-muted)] text-[var(--color-primary)]">
                <TeamIcon className="h-4 w-4" />
              </div>
            </div>
            {currentGroup ? (
              <div className="mt-3">{renderBadge("Tu Team")}</div>
            ) : (
              <Link
                href="/groups"
                className="mt-3 inline-flex items-center justify-center rounded-md border border-[var(--color-primary)] bg-[var(--color-primary)] px-3 py-2 text-sm font-bold text-white"
              >
                Crear o sumarme
              </Link>
            )}
          </div>
        </SurfaceCard>
      </section>

      <RankingPodiumBlocks
        hasComputedResults={hasComputedResults}
        individual={individualPodium}
        teams={teamPodium}
      />

      <section>
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-primary)]">
          Tu posiciÃ³n
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[1rem] border border-[var(--color-primary)] bg-[var(--color-surface)] p-3">
            <div className="flex items-center gap-2">
              <span className="font-serif text-[1.6rem] font-bold leading-none text-[var(--color-primary)]">
                {individualPositionLabel}
              </span>
              <span className="text-sm font-semibold text-[var(--color-ink)]">
                {formatShortPoints(currentUserRanking?.points ?? 0)}
              </span>
            </div>
            <p className="mt-2 text-[11px] leading-5 text-[var(--color-muted)]">
              Individual Â· {getParticipationStatus(participationStatus)}
            </p>
          </div>

          <div className="rounded-[1rem] border border-dashed border-[var(--color-line)] bg-[var(--color-surface)] p-3">
            <p className="font-serif text-[1.35rem] font-bold leading-none text-[var(--color-primary)]">
              {teamPositionLabel}
            </p>
            {currentGroup ? (
              <p className="mt-2 text-[11px] leading-5 text-[var(--color-muted)]">
                Team Â· {formatShortPoints(currentGroup.teamScore)} Â· {currentGroup.activeCount} jugador
                {currentGroup.activeCount === 1 ? "" : "es"} activos
              </p>
            ) : (
              <>
                <p className="mt-2 text-[11px] leading-5 text-[var(--color-muted)]">Sin Team</p>
                <Link
                  href="/groups"
                  className="mt-2 inline-flex items-center justify-center rounded-md border border-[var(--color-primary)] px-3 py-1.5 text-[11px] font-semibold text-[var(--color-primary)]"
                >
                  Crear o sumarme
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <SurfaceCard title="Ranking Individual" description="Top 10 jugadores">
        <div className="overflow-hidden rounded-[1rem] border border-[var(--color-line)]">
          <div className="grid grid-cols-[3rem_minmax(0,1fr)_4.5rem] items-center bg-[var(--color-primary)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
            <span>Pos</span>
            <span>Jugador</span>
            <span className="text-right">Pts</span>
          </div>

          {individualRows.length > 0 ? (
            <div className="max-h-[28rem] overflow-y-auto">
              {individualRows.slice(0, 10).map((row) => (
                <div
                  key={row.profileId}
                  className={[
                    "grid grid-cols-[3rem_minmax(0,1fr)_4.5rem] items-center gap-2 border-t border-[var(--color-line)] px-3 py-2.5",
                    row.isCurrentUser ? "bg-[rgba(154,225,255,0.18)]" : "bg-[var(--color-surface)]",
                  ].join(" ")}
                >
                  <span className="text-base font-bold text-[var(--color-primary)]">{row.position}</span>
                  <div className="flex min-w-0 items-center gap-2">
                    <PlayerAvatar imageUrl={row.avatarUrl} label={row.userLabel} size="sm" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
                          {row.userLabel}
                        </p>
                        {row.isCurrentUser ? renderBadge("Vos") : null}
                      </div>
                      <p className="truncate text-[11px] text-[var(--color-muted)]">
                        {row.teamName ?? "Sin Team"}
                      </p>
                    </div>
                  </div>
                  <span className="text-right text-base font-bold text-[var(--color-ink)]">{row.points}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-0">
              {Array.from({ length: 10 }, (_, index) => (
                <div
                  key={`individual-placeholder-${index + 1}`}
                  className="grid grid-cols-[3rem_minmax(0,1fr)_4.5rem] items-center gap-2 border-t border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2.5"
                >
                  <span className="text-base font-bold text-[var(--color-primary)]">{index + 1}</span>
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="player-avatar-sm">--</div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
                        Esperando jugadores
                      </p>
                      <p className="truncate text-[11px] text-[var(--color-muted)]">Sin Team</p>
                    </div>
                  </div>
                  <span className="text-right text-base font-bold text-[var(--color-ink)]">0</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </SurfaceCard>

      <SurfaceCard title="Ranking de Teams" description="Top 10 Teams">
        <div className="overflow-hidden rounded-[1rem] border border-[var(--color-line)]">
          <div className="grid grid-cols-[3rem_minmax(0,1fr)_4.5rem] items-center bg-[#0c6780] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
            <span>Pos</span>
            <span>Team / Jugadores</span>
            <span className="text-right">Pts</span>
          </div>

          {teamRows.length > 0 ? (
            <div className="max-h-[28rem] overflow-y-auto">
              {teamRows.map((entry) => {
                const isCurrentTeam = currentGroup?.groupId === entry.groupId;

                return (
                  <div
                    key={entry.groupId}
                    className={[
                      "grid grid-cols-[3rem_minmax(0,1fr)_4.5rem] items-center gap-2 border-t border-[var(--color-line)] px-3 py-2.5",
                      isCurrentTeam ? "bg-[rgba(255,225,109,0.12)]" : "bg-[var(--color-surface)]",
                    ].join(" ")}
                  >
                    <span className="text-base font-bold text-[var(--color-primary)]">{entry.position}</span>
                    <div className="flex min-w-0 items-center gap-2">
                      <div
                        className={[
                          "teams-avatar-sm shrink-0",
                          isCurrentTeam
                            ? "bg-[linear-gradient(135deg,#ffe16d_0%,#c9a900_100%)] text-[var(--color-ink)]"
                            : "bg-[linear-gradient(135deg,#9ae1ff_0%,#0047ab_100%)]",
                        ].join(" ")}
                      >
                        {buildTeamInitials(entry.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
                            {entry.name}
                          </p>
                          {isCurrentTeam ? renderBadge("Tu Team", "gold") : null}
                        </div>
                        <p className="truncate text-[11px] text-[var(--color-muted)]">
                          {entry.activeCount} Jugadores activos
                        </p>
                      </div>
                    </div>
                    <span className="text-right text-base font-bold text-[var(--color-ink)]">
                      {entry.teamScore}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid gap-0">
              {Array.from({ length: 10 }, (_, index) => (
                <div
                  key={`team-placeholder-${index + 1}`}
                  className="grid grid-cols-[3rem_minmax(0,1fr)_4.5rem] items-center gap-2 border-t border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2.5"
                >
                  <span className="text-base font-bold text-[var(--color-primary)]">{index + 1}</span>
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="teams-avatar-sm bg-[linear-gradient(135deg,#9ae1ff_0%,#0047ab_100%)]">
                      {getPlayerInitials(`Team ${index + 1}`)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
                        Esperando Teams
                      </p>
                      <p className="truncate text-[11px] text-[var(--color-muted)]">0 Jugadores activos</p>
                    </div>
                  </div>
                  <span className="text-right text-base font-bold text-[var(--color-ink)]">0</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </SurfaceCard>
    </PageStack>
  );
}


