import { HomeHero } from "@/components/home/home-hero";
import { HomeMatchList } from "@/components/home/home-match-list";
import { HomeRankingList } from "@/components/home/home-ranking-list";
import { HomeStats } from "@/components/home/home-stats";
import { HomeSteps, type HomeLandingStep } from "@/components/home/home-steps";
import type { HomeHeroState } from "@/lib/home/player-hero-state";
import { getHomeCommunityFeed } from "@/lib/home/community-feed";
import { formatEntryPrice } from "@/lib/product/entry-config";
import { getHomeDisplayMetrics } from "@/lib/product/home-display";

const LANDING_STEPS: readonly HomeLandingStep[] = [
  {
    step: "Paso 1",
    title: "Creás tu cuenta",
    description: "Entrás gratis, elegís tu alias y empezás a jugar sin pagar al registrarte.",
  },
  {
    step: "Paso 2",
    title: "Cargás tus pronósticos",
    description: "Guardás pronósticos como borrador y preparás tu torneo desde el celular.",
  },
  {
    step: "Paso 3",
    title: "Creá un equipo e invitá a tus amigos",
    description: "Pueden ganar la Copa y premios sorpresa.",
  },
  {
    step: "Paso 4",
    title: "Estate atento",
    description: "No te pierdas de cargar tus pronósticos antes de cada partido.",
  },
  {
    step: "Paso 5",
    title: "Activá tu cuenta",
    description:
      "Finalizá el proceso de inscripción para acceder a todas las funciones de SoliProde. Hoy por solo $5.000.",
  },
] as const;

type HomeLandingProps = {
  entryPrice: number;
  heroState: HomeHeroState;
};

export async function HomeLanding({ entryPrice, heroState }: HomeLandingProps) {
  const [homeDisplayMetrics, communityFeed] = await Promise.all([
    getHomeDisplayMetrics(),
    getHomeCommunityFeed(),
  ]);

  return (
    <>
      <div className="home-landing-shell">
        <HomeHero entryPrice={formatEntryPrice(entryPrice)} state={heroState} />
        <HomeStats
          prizePoolLabel={homeDisplayMetrics.prizePoolLabel}
          playersLabel={homeDisplayMetrics.playersLabel}
        />
      </div>

      <div className="home-landing-sheet">
        <HomeRankingList
          title="Ranking individual"
          description="Top jugadores con puntaje oficial."
          entries={communityFeed.rankings.individual}
          emptyMessage="Todavía no hay ranking individual publicado."
        />

        <HomeRankingList
          title="Ranking grupal"
          description="Teams con mejor puntaje acumulado."
          entries={communityFeed.rankings.groups}
          emptyMessage="Todavía no hay ranking grupal publicado."
          tone="group"
        />

        <HomeMatchList matches={communityFeed.matches} />
        <HomeSteps steps={LANDING_STEPS} />
      </div>
    </>
  );
}
