import { HomeHero } from "@/components/home/home-hero";
import { HomeMatchList, type HomeLandingMatch } from "@/components/home/home-match-list";
import { HomeStats } from "@/components/home/home-stats";
import { HomeSteps, type HomeLandingStep } from "@/components/home/home-steps";
import { formatEntryPrice } from "@/lib/product/entry-config";
import { getHomeDisplayMetrics } from "@/lib/product/home-display";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
    description: "Finalizá el proceso de inscripción para acceder a todas las funciones de SoliProde. Hoy por solo $5.000.",
  },
] as const;

const FALLBACK_MATCHES: readonly HomeLandingMatch[] = [
  {
    group: "C",
    kickoff: "14 jun · 16:00",
    home: { code: "ARG", name: "Argentina", countryCode: "AR" },
    away: { code: "MEX", name: "México", countryCode: "MX" },
  },
  {
    group: "C",
    kickoff: "15 jun · 13:00",
    home: { code: "FRA", name: "Francia", countryCode: "FR" },
    away: { code: "BRA", name: "Brasil", countryCode: "BR" },
  },
] as const;

type HomeMatchRow = {
  group_code: string | null;
  starts_at: string;
  home_team: {
    fifa_code: string | null;
    name: string;
    country_code: string | null;
  }[] | null;
  away_team: {
    fifa_code: string | null;
    name: string;
    country_code: string | null;
  }[] | null;
};

export type HomeLandingAction = {
  href: string;
  label: string;
};

type HomeLandingProps = {
  entryPrice: number;
  primaryAction: HomeLandingAction;
  secondaryAction: HomeLandingAction;
};

function formatLandingKickoff(startsAt: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(new Date(startsAt))
    .replace(",", " ·");
}

async function getLandingMatches(): Promise<HomeLandingMatch[]> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from("matches")
      .select(
        `
          group_code,
          starts_at,
          home_team:teams!matches_home_team_id_fkey(fifa_code, name, country_code),
          away_team:teams!matches_away_team_id_fkey(fifa_code, name, country_code)
        `,
      )
      .eq("status", "scheduled")
      .gt("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(2);

    const mapped = ((data ?? []) as HomeMatchRow[])
      .map((match) => {
        const homeTeam = match.home_team?.[0];
        const awayTeam = match.away_team?.[0];

        if (!homeTeam || !awayTeam) {
          return null;
        }

        return {
          group: match.group_code ?? "C",
          kickoff: formatLandingKickoff(match.starts_at),
          home: {
            code: homeTeam.fifa_code ?? homeTeam.name.slice(0, 3).toUpperCase(),
            name: homeTeam.name,
            countryCode: homeTeam.country_code,
          },
          away: {
            code: awayTeam.fifa_code ?? awayTeam.name.slice(0, 3).toUpperCase(),
            name: awayTeam.name,
            countryCode: awayTeam.country_code,
          },
        };
      })
      .filter((match): match is NonNullable<typeof match> => Boolean(match));

    return mapped.length > 0 ? mapped : [...FALLBACK_MATCHES];
  } catch {
    return [...FALLBACK_MATCHES];
  }
}

export async function HomeLanding({ entryPrice, primaryAction, secondaryAction }: HomeLandingProps) {
  const [homeDisplayMetrics, landingMatches] = await Promise.all([
    getHomeDisplayMetrics(),
    getLandingMatches(),
  ]);

  return (
    <>
      <div className="home-landing-shell">
        <HomeHero
          entryPrice={formatEntryPrice(entryPrice)}
          primaryAction={primaryAction}
          secondaryAction={secondaryAction}
        />
        <HomeStats
          prizePoolLabel={homeDisplayMetrics.prizePoolLabel}
          playersLabel={homeDisplayMetrics.playersLabel}
        />
      </div>

      <div className="home-landing-sheet">
        <HomeMatchList matches={landingMatches} />
        <HomeSteps steps={LANDING_STEPS} />
      </div>
    </>
  );
}
