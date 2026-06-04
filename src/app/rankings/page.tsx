/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { InfoNotice, PageStack } from "@/components/placeholder-primitives";
import { TeamIcon } from "@/components/app-icons";
import { PlayerAvatar } from "@/components/profile/player-avatar";
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
  avatar_url: string | null;
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

type IndividualPodiumEntry = {
  avatarUrl: string | null;
  isCurrentUser: boolean;
  key: string;
  label: string;
  points: number;
  position: number;
  variant: "real" | "dummy";
  placeholder?: boolean;
};

type TeamPodiumEntry = {
  activeCount: number;
  isCurrentTeam: boolean;
  key: string;
  name: string;
  points: number;
  position: number;
  variant: "real" | "dummy";
  placeholder?: boolean;
};

const PODIUM_PLAYER_DUMMIES = [
  "Jugador invitado",
  "Nuevo jugador",
  "Futbolero",
] as const;

const PODIUM_TEAM_DUMMIES = [
  "Rojito de mi vida",
  "Team Mundial",
  "Plantel Futbolero",
] as const;

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

function buildTeamInitials(name: string) {
  const cleaned = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);

  return cleaned || "TM";
}

function buildIndividualPodium(entries: IndividualLeaderboardEntry[]) {
  const padded = [...entries.slice(0, 3)];

  while (padded.length < 3) {
    const position = padded.length + 1;
    padded.push({
      avatarUrl: null,
      isCurrentUser: false,
      points: 0,
      position,
      profileId: `placeholder-${position}`,
      teamName: null,
      userLabel: PODIUM_PLAYER_DUMMIES[position - 1] ?? `Jugador ${position}`,
    });
  }

  return padded.map<IndividualPodiumEntry>((entry, index) => ({
    avatarUrl: entry.avatarUrl,
    isCurrentUser: entry.isCurrentUser,
    key: entry.profileId,
    label: entry.userLabel,
    points: entry.points,
    position: entry.position,
    variant: index >= entries.length ? "dummy" : "real",
    placeholder: index >= entries.length,
  }));
}

function buildTeamPodium(entries: GroupLeaderboardEntry[], currentGroupId: string | null) {
  const padded = [...entries.slice(0, 3)];

  while (padded.length < 3) {
    const position = padded.length + 1;
    padded.push({
      activeCount: 0,
      dtAlias: null,
      dtProfileId: null,
      groupId: `placeholder-${position}`,
      inviteCode: null,
      isEligible: false,
      name: PODIUM_TEAM_DUMMIES[position - 1] ?? `Team ${position}`,
      ownerProfileId: null,
      position,
      slug: `placeholder-${position}`,
      teamScore: 0,
      totalCount: 0,
    });
  }

  return padded.map<TeamPodiumEntry>((entry, index) => ({
    activeCount: entry.activeCount,
    isCurrentTeam: currentGroupId === entry.groupId,
    key: entry.groupId,
    name: entry.name,
    points: entry.teamScore,
    position: entry.position,
    variant: index >= entries.length ? "dummy" : "real",
    placeholder: index >= entries.length,
  }));
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

function PodiumPlayerPortrait({
  avatarUrl,
  dominant,
  label,
  variant,
}: {
  avatarUrl?: string | null;
  dominant: boolean;
  label: string;
  variant: "real" | "dummy";
}) {
  const sizeClass = dominant ? "h-[5.1rem] w-[5.1rem]" : "h-[4rem] w-[4rem]";
  const ringClass = dominant
    ? "border-[3px] border-[var(--color-gold)] shadow-[0_12px_30px_rgba(201,169,0,0.32)]"
    : "border-2 border-white/70 shadow-[0_10px_24px_rgba(0,50,125,0.18)]";

  if (avatarUrl && variant === "real") {
    return (
      <div
        className={[
          "overflow-hidden rounded-full bg-[linear-gradient(135deg,#9ae1ff_0%,#0047ab_100%)]",
          sizeClass,
          ringClass,
        ].join(" ")}
      >
        <img src={`/api/avatar?src=${encodeURIComponent(avatarUrl)}`} alt={label} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={[
        "relative overflow-hidden rounded-full bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.32),transparent_32%),linear-gradient(180deg,#0e5dc1_0%,#05357d_65%,#04285e_100%)]",
        sizeClass,
        ringClass,
      ].join(" ")}
    >
      <div className="absolute inset-x-0 bottom-0 h-[42%] bg-[linear-gradient(180deg,rgba(8,36,82,0)_0%,rgba(8,36,82,0.42)_35%,rgba(8,36,82,0.9)_100%)]" />
      <div className="absolute left-1/2 top-[22%] h-[28%] w-[28%] -translate-x-1/2 rounded-full bg-[#f6f8ff]" />
      <div className="absolute left-1/2 top-[44%] h-[34%] w-[56%] -translate-x-1/2 rounded-t-[999px] rounded-b-[40%] bg-[#f6f8ff]" />
      <div className="absolute left-1/2 top-[55%] h-[15%] w-[74%] -translate-x-1/2 rounded-full border border-white/15 bg-[linear-gradient(90deg,#ffe16d_0%,#9ae1ff_100%)] opacity-80" />
      <div className="absolute inset-x-[18%] bottom-[14%] h-[8%] rounded-full bg-white/16 blur-[2px]" />
    </div>
  );
}

function PodiumTeamCrest({
  dominant,
  label,
  variant,
}: {
  dominant: boolean;
  label: string;
  variant: "real" | "dummy";
}) {
  const sizeClass = dominant ? "h-[5.1rem] w-[5.1rem]" : "h-[4rem] w-[4rem]";
  const ringClass = dominant
    ? "border-[3px] border-[var(--color-gold)] shadow-[0_12px_30px_rgba(201,169,0,0.28)]"
    : "border-2 border-white/70 shadow-[0_10px_24px_rgba(0,50,125,0.18)]";
  const innerClass =
    variant === "dummy"
      ? "bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.34),transparent_34%),linear-gradient(180deg,#1355ad_0%,#0c6780_55%,#08345d_100%)]"
      : "bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.24),transparent_32%),linear-gradient(180deg,#1c6fda_0%,#0f4d9c_55%,#0c6780_100%)]";

  return (
    <div
      className={[
        "relative grid place-items-center overflow-hidden",
        sizeClass,
        ringClass,
        "rounded-[1.55rem] bg-white/80 p-[3px]",
        "[clip-path:polygon(50%_0%,89%_11%,100%_42%,84%_100%,16%_100%,0%_42%,11%_11%)]",
      ].join(" ")}
    >
      <div
        className={[
          "relative grid h-full w-full place-items-center overflow-hidden text-white",
          innerClass,
          "[clip-path:polygon(50%_0%,89%_11%,100%_42%,84%_100%,16%_100%,0%_42%,11%_11%)]",
        ].join(" ")}
      >
        <div className="absolute inset-x-[14%] top-[16%] h-[20%] rounded-full border border-white/16 bg-white/8" />
        <div className="absolute inset-x-[20%] bottom-[14%] h-[12%] rounded-full bg-white/12 blur-[2px]" />
        <div className="relative z-10 flex flex-col items-center gap-1">
          <div className="h-2 w-8 rounded-full bg-[var(--color-gold)]/90" />
          <span className="font-serif text-[1.05rem] font-bold uppercase tracking-[0.08em]">
            {buildTeamInitials(label)}
          </span>
          <div className="h-2 w-5 rounded-full bg-white/80" />
        </div>
      </div>
    </div>
  );
}

function PodiumEntryCard({
  activeCount,
  avatarUrl,
  dominant = false,
  isCurrent = false,
  label,
  points,
  position,
  team = false,
  variant,
}: {
  activeCount?: number;
  avatarUrl?: string | null;
  dominant?: boolean;
  isCurrent?: boolean;
  label: string;
  points: number;
  position: number;
  team?: boolean;
  variant: "real" | "dummy";
}) {
  const baseHeightClass = dominant ? "min-h-[5.5rem]" : position === 2 ? "min-h-[4.5rem]" : "min-h-[4rem]";
  const baseToneClass =
    position === 1
      ? "bg-[linear-gradient(180deg,#ffe16d_0%,#d4b100_100%)] text-[var(--color-ink)]"
      : position === 2
        ? "bg-[linear-gradient(180deg,#e6ebf5_0%,#c5cedf_100%)] text-[var(--color-primary)]"
        : "bg-[linear-gradient(180deg,#e4dac0_0%,#c9b78b_100%)] text-[var(--color-primary)]";
  const shellClass = dominant
    ? "bg-[linear-gradient(180deg,rgba(255,225,109,0.18)_0%,rgba(255,255,255,0.98)_48%,rgba(255,225,109,0.08)_100%)] border-[var(--color-gold)]/40"
    : "bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(238,242,248,0.94)_100%)] border-[var(--color-line)]";

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center justify-end">
      <div
        className={[
          "w-full rounded-[1.15rem] border px-2.5 pb-2.5 pt-3 text-center shadow-[0_12px_26px_rgba(0,50,125,0.1)]",
          shellClass,
        ].join(" ")}
      >
        <div className="flex justify-center">
          {team ? (
            <PodiumTeamCrest dominant={dominant} label={label} variant={variant} />
          ) : (
            <PodiumPlayerPortrait
              avatarUrl={avatarUrl}
              dominant={dominant}
              label={label}
              variant={variant}
            />
          )}
        </div>
        <div className="mt-2 flex justify-center">
          <span
            className={[
              "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em]",
              position === 1
                ? "bg-[var(--color-gold)]/22 text-[var(--color-ink)]"
                : "bg-[var(--color-surface-muted)] text-[var(--color-primary)]",
            ].join(" ")}
          >
            Puesto {position}
          </span>
        </div>
        <p
          className={[
            "mt-2 line-clamp-2 min-h-[2.25rem] font-serif uppercase leading-[1.05]",
            dominant ? "text-[1.15rem] font-bold text-[var(--color-primary)]" : "text-[0.95rem] font-bold text-[var(--color-ink)]",
          ].join(" ")}
        >
          {label}
        </p>
        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
          {formatShortPoints(points)}
          {team ? ` · ${activeCount ?? 0} activos` : ""}
        </p>
        {isCurrent ? (
          <div className="mt-2">{renderBadge(team ? "Tu Team" : "Vos", dominant ? "gold" : "blue")}</div>
        ) : (
          <div className="mt-2 h-5" />
        )}
      </div>
      <div
        className={[
          "mt-2 flex w-full items-center justify-center rounded-t-[1rem] px-2 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]",
          baseHeightClass,
          baseToneClass,
        ].join(" ")}
      >
        <div>
          <p className="font-serif text-[1.7rem] font-bold leading-none">{position}</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em]">
            {position === 1 ? "Lidera" : position === 2 ? "Persigue" : "Acecha"}
          </p>
        </div>
      </div>
    </div>
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
              .select("id, public_alias, full_name, avatar_url")
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
              ? currentUserAvatarUrl ?? getPlayerAvatar(profile)
              : getPlayerAvatar(profile);

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
                ? currentUserAvatarUrl ?? getPlayerAvatar(profile)
                : getPlayerAvatar(profile),
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
                  ? currentUserAvatarUrl ?? getPlayerAvatar(profile)
                  : getPlayerAvatar(profile),
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
  const provisionalCopy = "Todavía no hay partidos computados. Todos arrancan desde cero.";
  const individualPodium = buildIndividualPodium(individualRows);
  const teamPodium = buildTeamPodium(teamRows, currentGroup?.groupId ?? null);
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
              {updatedLabel ? ` · Actualizado ${updatedLabel}` : " · Ranking provisional"}
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
                    ? `${formatShortPoints(currentGroup.teamScore)} · ${currentGroup.activeCount} jugador${
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

      <SurfaceCard
        title="Podios provisionales"
        description={hasComputedResults ? "Así viene la pelea ahora mismo." : provisionalCopy}
      >
        <div className="grid gap-4">
          <div className="overflow-hidden rounded-[1.2rem] border border-[var(--color-line)] bg-[linear-gradient(180deg,#f5f7fb_0%,#edf2f8_100%)] p-4 shadow-[0_12px_28px_rgba(0,50,125,0.08)]">
            <div className="mb-3">
              <div>
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-primary)]">
                  Individual
                </h2>
                <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
                  Así arranca la pelea individual mientras se cargan los primeros resultados.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 items-end gap-2">
              {[individualPodium[1], individualPodium[0], individualPodium[2]].map((entry) => (
                <PodiumEntryCard
                  key={entry.key}
                  avatarUrl={entry.avatarUrl}
                  dominant={entry.position === 1}
                  isCurrent={entry.isCurrentUser}
                  label={entry.label}
                  points={entry.points}
                  position={entry.position}
                  variant={entry.variant}
                />
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.2rem] border border-[var(--color-line)] bg-[linear-gradient(180deg,#f5f7fb_0%,#edf2f8_100%)] p-4 shadow-[0_12px_28px_rgba(0,50,125,0.08)]">
            <div className="mb-3">
              <div>
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0c6780]">
                  Teams
                </h2>
                <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
                  El ranking de Teams arranca con Planteles completos o con dummies de competencia.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 items-end gap-2">
              {[teamPodium[1], teamPodium[0], teamPodium[2]].map((entry) => (
                <PodiumEntryCard
                  key={entry.key}
                  activeCount={entry.activeCount}
                  dominant={entry.position === 1}
                  isCurrent={entry.isCurrentTeam}
                  label={entry.name}
                  points={entry.points}
                  position={entry.position}
                  team
                  variant={entry.variant}
                />
              ))}
            </div>
          </div>
        </div>
      </SurfaceCard>

      <section>
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-primary)]">
          Tu posición
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
              Individual · {getParticipationStatus(participationStatus)}
            </p>
          </div>

          <div className="rounded-[1rem] border border-dashed border-[var(--color-line)] bg-[var(--color-surface)] p-3">
            <p className="font-serif text-[1.35rem] font-bold leading-none text-[var(--color-primary)]">
              {teamPositionLabel}
            </p>
            {currentGroup ? (
              <p className="mt-2 text-[11px] leading-5 text-[var(--color-muted)]">
                Team · {formatShortPoints(currentGroup.teamScore)} · {currentGroup.activeCount} jugador
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
