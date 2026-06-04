export type TeamMember = {
  id: string;
  name: string;
  roleLabel: string;
  points: number;
  status: "captain" | "dt" | "starter" | "bench" | "registered";
  accent: string;
  note?: string;
  isCaptain?: boolean;
  isDt?: boolean;
};

export type TeamRankingEntry = {
  name: string;
  points: number;
  position: number;
  isCurrentTeam?: boolean;
};

export const teamsPageMock = {
  teamName: "SoliProde FC",
  teamScore: 1248,
  statusLabel: "En competencia",
  headline: "Armá tu Team. Entran todos. Puntúan los mejores 11.",
  supportCopy:
    "El Capitán arma el Team. El DT se gana el puesto sumando puntos. Los mejores 11 salen a buscar La Gloria.",
  captain: {
    name: "Julian Rossi",
    alias: "El Muro",
    badge: "Capitan",
    detail: "Creador del Team y responsable de compartir el Pase Solidario.",
    accent: "#0c6780",
  },
  dt: {
    name: "Marco De Santis",
    badge: "DT del Team",
    detail: "Jugador activo con mas puntos. El DT se gana el puesto sumando puntos.",
    points: 188,
    accent: "#e9c400",
  },
  starterPointsLabel: "11 titular",
  benchLabel: "Banco",
  rosterLabel: "Plantel",
  contributionLabel: "Aporte confirmado",
  solidarityPassLabel: "Pase Solidario",
  gloryLabel: "La Gloria",
  starters: [
    { id: "s1", name: "Mateo Fernandez", roleLabel: "Mediocampo", points: 184, status: "starter", accent: "#1f6ed4" },
    { id: "s2", name: "Luca Wagner", roleLabel: "Delantero", points: 162, status: "starter", accent: "#0c6780" },
    { id: "s3", name: "Renzo Alvarez", roleLabel: "Arquero", points: 147, status: "starter", accent: "#2559bd" },
    { id: "s4", name: "Thiago Benitez", roleLabel: "Defensor", points: 125, status: "starter", accent: "#00327d" },
    { id: "s5", name: "Pablo Quiroga", roleLabel: "Mediocampo", points: 113, status: "starter", accent: "#0c6780" },
    { id: "s6", name: "Santiago Costa", roleLabel: "Defensor", points: 109, status: "starter", accent: "#1f6ed4" },
    { id: "s7", name: "Julian Rossi", roleLabel: "Capitan", points: 104, status: "captain", accent: "#0c6780", note: "El Capitan arma el Team." },
    { id: "s8", name: "Matias Lopez", roleLabel: "Delantero", points: 92, status: "starter", accent: "#2559bd" },
    { id: "s9", name: "Bruno Salvatierra", roleLabel: "Defensor", points: 83, status: "starter", accent: "#00327d" },
    { id: "s10", name: "Federico Sosa", roleLabel: "Mediocampo", points: 67, status: "starter", accent: "#1f6ed4" },
    { id: "s11", name: "Damian Pereyra", roleLabel: "Volante", points: 62, status: "starter", accent: "#0c6780" },
  ] satisfies TeamMember[],
  bench: [
    { id: "b1", name: "Sandro Tonali", roleLabel: "Mediocampo", points: 76, status: "bench", accent: "#1f6ed4" },
    { id: "b2", name: "Bruno Guimaraes", roleLabel: "Delantero", points: 72, status: "bench", accent: "#0c6780" },
    { id: "b3", name: "Nicolas Tagliafico", roleLabel: "Defensor", points: 65, status: "bench", accent: "#2559bd" },
  ] satisfies TeamMember[],
  registered: [
    { id: "r1", name: "Nicolas Otamendi", roleLabel: "Registrado", points: 0, status: "registered", accent: "#737784", note: "Todavia no suma." },
    { id: "r2", name: "Emiliano Martinez", roleLabel: "Registrado", points: 0, status: "registered", accent: "#737784", note: "Esperando Aporte confirmado." },
    { id: "r3", name: "Angel Di Maria", roleLabel: "Registrado", points: 0, status: "registered", accent: "#737784", note: "Sigue en el Plantel." },
  ] satisfies TeamMember[],
  ranking: [
    { position: 1, name: "Titanes del Barrio", points: 1412 },
    { position: 2, name: "La Banda Mundial", points: 1389 },
    { position: 3, name: "Pampas Warriors", points: 1345 },
    { position: 7, name: "SoliProde FC", points: 1248, isCurrentTeam: true },
    { position: 8, name: "Sudaca Pressing", points: 1210 },
    { position: 9, name: "Los de Siempre", points: 1194 },
  ] satisfies TeamRankingEntry[],
};
