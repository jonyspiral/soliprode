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
 * Mantener `mode: "review"` hasta completar la auditoría y aprobar
 * expresamente el ranking final y el valor del premio.
 */
export const closingAnnouncementConfig: ClosingAnnouncementConfig = {
  mode: "review",
  eyebrow: "Mundial finalizado",
  title: "Estamos validando el ranking final",
  description:
    "Revisamos los últimos partidos y los pronósticos especiales antes de anunciar oficialmente a los ganadores de SoliProde.",
  rankingHref: "/rankings",
};
