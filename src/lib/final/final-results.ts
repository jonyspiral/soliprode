export type FinalStanding = {
  alias: string;
  matchPoints: number;
  points: number;
  position: number;
  specialPoints: number;
};

export type FinalMetric = {
  label: string;
  value: string;
};

export const finalTournamentResults = {
  edition: "SoliProde Mundial 2026",
  eyebrow: "Mundial finalizado",
  title: "Gracias por jugar SoliProde 2026",
  description:
    "Cerramos los 104 partidos, resolvimos los siete pronósticos especiales y recalculamos el ranking completo desde la fuente oficial.",
  metrics: [
    { label: "Personas registradas", value: "61" },
    { label: "Partidos finalizados", value: "104" },
    { label: "Pronósticos cargados", value: "1.163" },
  ] satisfies readonly FinalMetric[],
  standings: [
    { position: 1, alias: "Pablo Mundial", points: 295, matchPoints: 247, specialPoints: 48 },
    { position: 2, alias: "Salvador Pirolo", points: 288, matchPoints: 250, specialPoints: 38 },
    { position: 3, alias: "Tomas Kilian", points: 173, matchPoints: 173, specialPoints: 0 },
    { position: 4, alias: "Jorge Blanco", points: 165, matchPoints: 165, specialPoints: 0 },
    { position: 5, alias: "Clara Iglesias", points: 164, matchPoints: 164, specialPoints: 0 },
    { position: 6, alias: "ElDiego", points: 148, matchPoints: 148, specialPoints: 0 },
    { position: 7, alias: "Adrian Zappia", points: 132, matchPoints: 132, specialPoints: 0 },
    { position: 8, alias: "Gaby Flores", points: 131, matchPoints: 131, specialPoints: 0 },
    { position: 9, alias: "Clarii", points: 129, matchPoints: 129, specialPoints: 0 },
    { position: 10, alias: "Giuliano Pane", points: 124, matchPoints: 124, specialPoints: 0 },
  ] satisfies readonly FinalStanding[],
  prize: {
    poolLabel: "$ 300.000",
    firstLabel: "$ 270.000",
    secondLabel: "$ 30.000",
    thirdLabel: "Medalla o premio sorpresa",
  },
  teamLeader: {
    name: "Mas50CCVA",
    points: 593,
    activePlayers: 4,
    minimumActivePlayers: 7,
    note:
      "Fue el Team con mayor puntaje. La Copa de Teams no se adjudica porque ningún equipo alcanzó el mínimo reglamentario de siete jugadores activos.",
  },
  specials: [
    { label: "Campeón del Mundial", result: "España", points: 20 },
    { label: "Subcampeón", result: "Argentina", points: 10 },
    { label: "Argentina llegó", result: "A la final", points: 10 },
    { label: "Bota de Oro", result: "Kylian Mbappé", points: 7 },
    { label: "Balón de Oro", result: "Opción «Otro jugador»", points: 7 },
    { label: "Mejor arquero", result: "Opción «Otro arquero»", points: 7 },
    { label: "Mejor jugador joven", result: "Opción «Otro joven»", points: 7 },
  ],
  cause: {
    eyebrow: "El resultado más importante",
    title: "Jugamos por algo más grande que una tabla.",
    description:
      "Gracias a cada persona que participó. SoliProde convirtió el Mundial en una forma concreta de acompañar a estudiantes universitarios en la etapa final de su carrera.",
  },
} as const;
