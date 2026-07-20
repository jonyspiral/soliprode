export type ClosingAnnouncementWinner = {
  position: 1 | 2 | 3;
  alias: string;
  points: number;
};

export type ClosingAnnouncementConfig =
  | {
      mode: "review";
      eyebrow: string;
      title: string;
      description: string;
      rankingHref: string;
    }
  | {
      mode: "official";
      eyebrow: string;
      title: string;
      description: string;
      prizeLabel: string;
      winners: readonly ClosingAnnouncementWinner[];
      rankingHref: string;
    };

/**
 * Estado editorial del cierre del torneo.
 *
 * El ranking fue recalculado desde los 104 partidos finalizados y los siete
 * pronósticos especiales resueltos el 20 de julio de 2026.
 */
export const closingAnnouncementConfig: ClosingAnnouncementConfig = {
  mode: "official",
  eyebrow: "Resultados oficiales",
  title: "Pablo Mundial es el campeón de SoliProde 2026",
  description:
    "El torneo terminó. Ya podés ver el podio definitivo, el Top 10, los premios y el impacto solidario de esta edición.",
  prizeLabel: "Pozo individual: $ 300.000",
  winners: [
    { position: 1, alias: "Pablo Mundial", points: 295 },
    { position: 2, alias: "Salvador Pirolo", points: 288 },
    { position: 3, alias: "Tomas Kilian", points: 173 },
  ],
  rankingHref: "/final",
};
