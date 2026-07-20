import type { Metadata } from "next";

import { CompactFinalTournamentScreen } from "@/components/final/compact-final-tournament-screen";
import { PageStack } from "@/components/placeholder-primitives";

export const metadata: Metadata = {
  title: "Resultados finales | SoliProde",
  description: "Cierre oficial de SoliProde Mundial 2026: campeón, podio, Top 5, premios y resultados especiales.",
};

export default function FinalTournamentPage() {
  return (
    <PageStack>
      <CompactFinalTournamentScreen />
    </PageStack>
  );
}
