import type {
  GroupCompetitionSnapshot,
  GroupLeaderboardEntry,
  GroupMemberSnapshot,
} from "@/lib/groups/competition";
import { getTeamMinActivePlayers, getTeamScoringMaxPlayers } from "@/lib/competition/settings";
import type { TeamMember, TeamRankingEntry } from "@/app/teams/_mock";

export type TeamsScreenData = {
  canEditAvatar?: boolean;
  currentAvatarChoice?: string;
  groupAvatarSeed?: string | null;
  groupAvatarUrl?: string | null;
  groupAvatarVariant?: string | null;
  groupFallbackAvatarUrl?: string | null;
  groupId?: string | null;
  teamName: string;
  teamScore: number;
  statusLabel: string;
  headline: string;
  supportCopy: string;
  currentParticipationStatus: string | null;
  captain: {
    avatarSeed: string | null;
    avatarUrl: string | null;
    avatarVariant: string | null;
    fallbackAvatarUrl: string | null;
    name: string;
    alias: string;
    badge: string;
    detail: string;
    accent: string;
  };
  dt: {
    avatarSeed: string | null;
    avatarUrl: string | null;
    avatarVariant: string | null;
    fallbackAvatarUrl: string | null;
    name: string;
    badge: string;
    detail: string;
    points: number;
    accent: string;
  };
  contributionLabel: string;
  inviteCode: string | null;
  starters: TeamMember[];
  bench: TeamMember[];
  registered: TeamMember[];
  ranking: TeamRankingEntry[];
};

const palette = [
  "#1f6ed4",
  "#0c6780",
  "#2559bd",
  "#00327d",
  "#2a7de1",
  "#0f819c",
];

function aliasToAccent(index: number) {
  return palette[index % palette.length];
}

function buildAliasParts(alias: string | null | undefined) {
  if (!alias || !alias.trim()) {
    return { name: "Capitán del Team", alias: "SoliProde" };
  }

  const parts = alias.trim().split(/\s+/);

  if (parts.length === 1) {
    return { name: parts[0], alias: "Del Team" };
  }

  return {
    name: parts.slice(0, 2).join(" "),
    alias: parts.slice(2).join(" ") || "Del Team",
  };
}

function toStarter(member: GroupMemberSnapshot, index: number, captainProfileId: string | null): TeamMember {
  const isCaptain = captainProfileId === member.profileId;
  const isDt = index === 0;

  return {
    id: member.profileId,
    avatarSeed: member.avatarSeed,
    avatarUrl: member.avatarUrl,
    avatarVariant: member.avatarVariant,
    fallbackAvatarUrl: member.fallbackAvatarUrl,
    name: member.alias,
    roleLabel: isCaptain ? "Capitán" : "Jugador activo",
    points: member.points,
    status: isCaptain ? "captain" : isDt ? "dt" : "starter",
    accent: aliasToAccent(index),
    note: isCaptain ? "El Capitán arma el Team." : undefined,
    isCaptain,
    isDt,
  };
}

function toBench(member: GroupMemberSnapshot, index: number): TeamMember {
  return {
    id: member.profileId,
    avatarSeed: member.avatarSeed,
    avatarUrl: member.avatarUrl,
    avatarVariant: member.avatarVariant,
    fallbackAvatarUrl: member.fallbackAvatarUrl,
    name: member.alias,
    roleLabel: "Jugador activo",
    points: member.points,
    status: "bench",
    accent: aliasToAccent(index + 2),
  };
}

function toRegistered(member: GroupMemberSnapshot, index: number): TeamMember {
  return {
    id: member.profileId,
    avatarSeed: member.avatarSeed,
    avatarUrl: member.avatarUrl,
    avatarVariant: member.avatarVariant,
    fallbackAvatarUrl: member.fallbackAvatarUrl,
    name: member.alias,
    roleLabel: "Registrado",
    points: 0,
    status: "registered",
    accent: aliasToAccent(index + 4),
    note:
      member.paymentStatus === "pending"
        ? "Esperando Aporte confirmado."
        : "Todavía no suma.",
  };
}

function toRankingEntry(entry: GroupLeaderboardEntry, currentGroupId: string | null): TeamRankingEntry {
  return {
    avatarSeed: entry.avatarSeed,
    avatarUrl: entry.avatarUrl,
    avatarVariant: entry.avatarVariant,
    fallbackAvatarUrl: entry.fallbackAvatarUrl,
    position: entry.position,
    name: entry.name,
    points: entry.teamScore,
    isCurrentTeam: entry.groupId === currentGroupId,
    dtAvatarUrl: entry.dtAvatarUrl,
  };
}

export function buildTeamsScreenFallbackData(
  options?: {
    authStatus?: "guest" | "member";
    currentAlias?: string | null;
    currentParticipationStatus?: string | null;
    leaderboard?: GroupCompetitionSnapshot["leaderboard"];
    errorState?: boolean;
  },
): TeamsScreenData {
  const ranking = options?.leaderboard?.length
    ? options.leaderboard.map((entry) => toRankingEntry(entry, null))
    : [];
  const isGuest = options?.authStatus !== "member";
  const isError = options?.errorState === true;
  const statusLabel = isError ? "Estado seguro" : isGuest ? "Modo visitante" : "Sin Team";
  const headline = isError
    ? "No pudimos cargar tu Team ahora."
    : isGuest
      ? "Entrá para armar tu Team o sumarte con un Código del Team."
      : "Todavía no tenés Team.";
  const supportCopy = isError
    ? "Reintentá en unos minutos. Mientras tanto, no vamos a mostrar datos inventados."
    : isGuest
      ? "Podés mirar la competencia y entrar cuando quieras para crear o unirte a un Team."
      : "Creá tu Team o unite por código. Cuando haya jugadores activos, se arma el 11 titular real.";

  return {
    teamName: isError ? "Teams" : isGuest ? "Teams" : "Tu próximo Team",
    teamScore: 0,
    statusLabel,
    headline,
    supportCopy,
    currentParticipationStatus: options?.currentParticipationStatus ?? null,
    canEditAvatar: false,
    currentAvatarChoice: "auto",
    captain: {
      avatarSeed: null,
      avatarUrl: null,
      avatarVariant: null,
      fallbackAvatarUrl: null,
      name: isGuest ? "Sin Capitán" : "Todavía sin Capitán",
      alias: isGuest ? "hasta ingresar" : "hasta crear o unirte",
      badge: "Capitán",
      detail: isGuest
        ? "Entrá con tu cuenta para crear o sumarte a un Team."
        : "Cuando tengas Team, acá vas a ver al Capitán real.",
      accent: "#0c6780",
    },
    dt: {
      avatarSeed: null,
      avatarUrl: null,
      avatarVariant: null,
      fallbackAvatarUrl: null,
      name: "Todavía no hay DT",
      badge: "DT del Team",
      detail: "El DT aparece cuando haya Jugadores activos sumando puntos reales.",
      points: 0,
      accent: "#e9c400",
    },
    contributionLabel: "Aporte confirmado",
    groupAvatarSeed: null,
    groupAvatarUrl: null,
    groupAvatarVariant: null,
    groupFallbackAvatarUrl: null,
    groupId: null,
    inviteCode: null,
    starters: [],
    bench: [],
    registered: [],
    ranking,
  };
}

export function buildTeamsScreenDataFromSnapshot(
  snapshot: GroupCompetitionSnapshot,
): TeamsScreenData | null {
  const currentGroup = snapshot.currentGroup;

  if (!currentGroup) {
    return null;
  }

  const teamMinActivePlayers = getTeamMinActivePlayers();
  const teamScoringMaxPlayers = getTeamScoringMaxPlayers();
  const activeMembers = currentGroup.members.filter((member) => member.isActive);
  const registeredMembers = currentGroup.members.filter((member) => !member.isActive);
  const starters = activeMembers.slice(0, teamScoringMaxPlayers).map((member, index) =>
    toStarter(member, index, currentGroup.ownerProfileId),
  );
  const bench = activeMembers.slice(teamScoringMaxPlayers).map((member, index) => toBench(member, index));
  const registered = registeredMembers.map((member, index) => toRegistered(member, index));
  const teamScore = starters.reduce((sum, member) => sum + member.points, 0);
  const captainParts = buildAliasParts(
    currentGroup.members.find((member) => member.profileId === currentGroup.ownerProfileId)?.alias ??
      snapshot.currentUserAlias ??
      currentGroup.name,
  );
  const dtMember = activeMembers[0];
  const ranking = snapshot.leaderboard.map((entry) => toRankingEntry(entry, currentGroup.groupId));

  return {
    canEditAvatar: currentGroup.members.some(
      (member) => member.isCurrentUser && member.profileId === currentGroup.ownerProfileId,
    ),
    currentAvatarChoice: currentGroup.avatarChoice?.trim() ? currentGroup.avatarChoice : "auto",
    teamName: currentGroup.name,
    teamScore,
    statusLabel: currentGroup.activeCount >= teamMinActivePlayers ? "En competencia" : "Team en formación",
    headline: "Armá tu Team. Entran todos. Puntúan los mejores 11.",
    supportCopy:
      "El Capitán arma el Team. El DT se gana el puesto sumando puntos. Los mejores 11 salen a buscar La Gloria.",
    currentParticipationStatus: snapshot.currentParticipationStatus,
    groupAvatarSeed: currentGroup.avatarSeed,
    groupAvatarUrl: currentGroup.avatarUrl,
    groupAvatarVariant: currentGroup.avatarVariant,
    groupFallbackAvatarUrl: currentGroup.fallbackAvatarUrl,
    groupId: currentGroup.groupId,
    captain: {
      avatarSeed:
        currentGroup.members.find((member) => member.profileId === currentGroup.ownerProfileId)?.avatarSeed ?? null,
      avatarUrl:
        currentGroup.members.find((member) => member.profileId === currentGroup.ownerProfileId)?.avatarUrl ?? null,
      avatarVariant:
        currentGroup.members.find((member) => member.profileId === currentGroup.ownerProfileId)?.avatarVariant ?? null,
      fallbackAvatarUrl:
        currentGroup.members.find((member) => member.profileId === currentGroup.ownerProfileId)?.fallbackAvatarUrl ?? null,
      name: captainParts.name,
      alias: captainParts.alias,
      badge: "Capitán",
      detail: "Creador del Team y responsable de compartir el link y el Código del Team.",
      accent: "#0c6780",
    },
    dt: {
      avatarSeed: dtMember?.avatarSeed ?? null,
      avatarUrl: dtMember?.avatarUrl ?? null,
      avatarVariant: dtMember?.avatarVariant ?? null,
      fallbackAvatarUrl: dtMember?.fallbackAvatarUrl ?? null,
      name: dtMember?.alias ?? "Todavía no hay DT",
      badge:
        dtMember && dtMember.profileId === currentGroup.ownerProfileId ? "Capitán · DT" : "DT del Team",
      detail:
        "Jugador activo con más puntos. El DT se gana el puesto sumando puntos.",
      points: dtMember?.points ?? 0,
      accent: "#e9c400",
    },
    contributionLabel: "Aporte confirmado",
    inviteCode: currentGroup.inviteCode,
    starters,
    bench,
    registered,
    ranking,
  };
}
