import type {
  GroupCompetitionSnapshot,
  GroupLeaderboardEntry,
  GroupMemberSnapshot,
} from "@/lib/groups/competition";
import type { TeamMember, TeamRankingEntry } from "@/app/teams/_mock";

export type TeamsScreenData = {
  state: "guest" | "no-team" | "team" | "error";
  teamName: string;
  teamScore: number;
  statusLabel: string;
  headline: string;
  supportCopy: string;
  currentParticipationStatus: string | null;
  captain: {
    name: string;
    alias: string;
    badge: string;
    detail: string;
    accent: string;
  };
  dt: {
    name: string;
    badge: string;
    detail: string;
    points: number;
    accent: string;
    profileId: string | null;
  };
  contributionLabel: string;
  solidarityPassLabel: string;
  gloryLabel: string;
  inviteCode: string | null;
  inviteLinkPath: string | null;
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
    return { name: "Capitan del Team", alias: "SoliProde" };
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
    name: member.alias,
    roleLabel: isCaptain ? "Capitan" : "Jugador activo",
    points: member.points,
    status: isCaptain ? "captain" : isDt ? "dt" : "starter",
    accent: aliasToAccent(index),
    note: isCaptain ? "El Capitan arma el Team." : undefined,
    isCaptain,
    isDt,
  };
}

function toBench(member: GroupMemberSnapshot, index: number): TeamMember {
  return {
    id: member.profileId,
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
    name: member.alias,
    roleLabel: "Registrado",
    points: 0,
    status: "registered",
    accent: aliasToAccent(index + 4),
    note:
      member.paymentStatus === "pending"
        ? "Esperando Aporte confirmado."
        : "Todavia no suma.",
  };
}

function toRankingEntry(entry: GroupLeaderboardEntry, currentGroupId: string | null): TeamRankingEntry {
  return {
    position: entry.position,
    name: entry.name,
    points: entry.teamScore,
    isCurrentTeam: entry.groupId === currentGroupId,
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
  const state = isError ? "error" : isGuest ? "guest" : "no-team";
  const statusLabel = isError ? "Estado seguro" : isGuest ? "Modo visitante" : "Sin Team";
  const headline = isError
    ? "No pudimos cargar tu Team ahora."
    : isGuest
      ? "Entrá para armar tu Team o sumarte con un Pase Solidario."
      : "Todavía no tenés Team.";
  const supportCopy = isError
    ? "Reintentá en unos minutos. Mientras tanto, no vamos a mostrar datos inventados."
    : isGuest
      ? "Podés mirar la competencia y entrar cuando quieras para crear o unirte a un Team."
      : "Creá tu Team o unite por código. Cuando haya jugadores activos, se arma el 11 titular real.";

  return {
    state,
    teamName: isError ? "Teams" : isGuest ? "Teams" : "Tu próximo Team",
    teamScore: 0,
    statusLabel,
    headline,
    supportCopy,
    currentParticipationStatus: options?.currentParticipationStatus ?? null,
    captain: {
      name: isGuest ? "Sin Capitán" : "Todavía sin Capitán",
      alias: isGuest ? "hasta ingresar" : "hasta crear o unirte",
      badge: "Capitán",
      detail: isGuest
        ? "Entrá con tu cuenta para crear o sumarte a un Team."
        : "Cuando tengas Team, acá vas a ver al Capitán real.",
      accent: "#0c6780",
    },
    dt: {
      name: "Todavía no hay DT",
      badge: "DT del Team",
      detail: "El DT aparece cuando haya Jugadores activos sumando puntos reales.",
      points: 0,
      accent: "#e9c400",
      profileId: null,
    },
    contributionLabel: "Aporte confirmado",
    solidarityPassLabel: "Pase Solidario",
    gloryLabel: "La Gloria",
    inviteCode: null,
    inviteLinkPath: null,
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

  const activeMembers = currentGroup.members.filter((member) => member.isActive);
  const registeredMembers = currentGroup.members.filter((member) => !member.isActive);
  const starters = activeMembers.slice(0, 11).map((member, index) =>
    toStarter(member, index, currentGroup.ownerProfileId),
  );
  const bench = activeMembers.slice(11).map((member, index) => toBench(member, index));
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
    state: "team",
    teamName: currentGroup.name,
    teamScore,
    statusLabel: currentGroup.activeCount >= 11 ? "En competencia" : "Team en formacion",
    headline: "Armá tu Team. Entran todos. Puntúan los mejores 11.",
    supportCopy:
      "El Capitán arma el Team. El DT se gana el puesto sumando puntos. Los mejores 11 salen a buscar La Gloria.",
    currentParticipationStatus: snapshot.currentParticipationStatus,
    captain: {
      name: captainParts.name,
      alias: captainParts.alias,
      badge: "Capitan",
      detail: "Creador del Team y responsable de compartir el Pase Solidario.",
      accent: "#0c6780",
    },
    dt: {
      name: dtMember?.alias ?? "Todavia no hay DT",
      badge:
        dtMember && dtMember.profileId === currentGroup.ownerProfileId ? "Capitán · DT" : "DT del Team",
      detail:
        "Jugador activo con mas puntos. El DT se gana el puesto sumando puntos.",
      points: dtMember?.points ?? 0,
      accent: "#e9c400",
      profileId: dtMember?.profileId ?? null,
    },
    contributionLabel: "Aporte confirmado",
    solidarityPassLabel: "Pase Solidario",
    gloryLabel: "La Gloria",
    inviteCode: currentGroup.inviteCode,
    inviteLinkPath: currentGroup.inviteCode ? `/groups?code=${currentGroup.inviteCode}` : null,
    starters,
    bench,
    registered,
    ranking,
  };
}
