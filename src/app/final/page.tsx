import type { Metadata } from "next";

import { FinalTournamentScreen } from "@/components/final/final-tournament-screen";
import { PageStack } from "@/components/placeholder-primitives";

export const metadata: Metadata = {
  title: "Resultados finales | SoliProde",
  description:
    "Cierre oficial de SoliProde Mundial 2026: campeón, podio, Top 10, premios y resultados especiales.",
};

export default function FinalTournamentPage() {
  return (
    <PageStack>
      <FinalTournamentScreen />
    </PageStack>
  );
}
