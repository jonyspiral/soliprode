import Image from "next/image";
import Link from "next/link";
import { CountryFlag } from "@/components/country-flag";
import { PromoCountdownInline } from "@/components/home/promo-countdown-inline";
import { PageStack } from "@/components/placeholder-primitives";
import {
  appendPromoterQuery,
  readPromoterCodeFromSearchParams,
} from "@/lib/auth/promoter-attribution";
import { getServerSessionState } from "@/lib/auth/session-state";
import { entryConfig, formatEntryPrice } from "@/lib/product/entry-config";
import { getHomeDisplayMetrics } from "@/lib/product/home-display";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const LANDING_STEPS = [
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

const FALLBACK_MATCHES = [
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

async function getLandingMatches() {
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

type HomeProps = {
  searchParams?: Promise<{
    p?: string;
    promoter?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const entryPrice = formatEntryPrice(entryConfig.initialPrice);
  const params = searchParams ? await searchParams : undefined;
  const promoterCode = params ? readPromoterCodeFromSearchParams(new URLSearchParams(params)) : null;
  const sessionState = await getServerSessionState();
  const homeDisplayMetrics = await getHomeDisplayMetrics();
  const landingMatches = await getLandingMatches();
  const loginHref = appendPromoterQuery("/login", promoterCode);
  const registerHref = appendPromoterQuery("/register", promoterCode);
  const primaryAction = !sessionState.isAuthenticated
    ? { href: registerHref, label: "Entrá al Prode" }
    : sessionState.isPaid
      ? { href: "/matches", label: "Cargá tus pronósticos" }
      : { href: "/dashboard", label: "Entrá al Prode" };
  const secondaryAction = !sessionState.isAuthenticated
    ? { href: loginHref, label: "Ya tengo cuenta" }
    : sessionState.isPaid
      ? { href: "/rankings", label: "Ver ranking" }
      : { href: "/matches", label: "Ya tengo cuenta" };

  return (
    <PageStack>
      <div className="-mx-4 -mt-2 overflow-hidden bg-[#001a5c] md:-mx-6 md:rounded-[2rem]">
        <section className="relative">
          <div className="relative flex min-h-[27.5rem] flex-col justify-end px-5 pb-[1.35rem] text-left md:min-h-[34rem] md:px-8 md:pb-6">
            <Image
              src="/lio_copa.jpeg"
              alt="Jugador con la Copa del Mundo"
              fill
              priority
              unoptimized
              className="object-cover object-[55%_18%]"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,transparent_48%,rgba(0,26,92,0.65)_65%,rgba(0,26,92,0.95)_80%,#001a5c_100%)]" />
            <div className="relative z-10 grid items-stretch gap-3.5 text-left">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#ffe16d]">
                ¡Ayuda y gana!
              </p>
              <h1 className="max-w-full font-serif text-[2.35rem] font-bold leading-[0.92] text-white md:text-[3.4rem]">
                ¡Jugá el Mundial y llevate todo!
              </h1>
              <p className="max-w-full text-[0.875rem] leading-6 text-[#dfe6ff]">
                Y de paso, bancás a un grupo de universitarios a terminar su carrera.
              </p>
              <p className="max-w-full text-[1rem] font-semibold leading-[1.45] text-[#ffe16d] drop-shadow-[0_1px_8px_rgba(0,0,0,0.55)]">
                Jugás un Prode Mundial… para ser campeón, tenés que sumar.{" "}
                <strong className="font-extrabold text-white">Creá equipo con 11 amigos</strong> y competí por la{" "}
                <strong className="font-extrabold text-white">Copa SoliProde.</strong>
              </p>
              <div className="grid gap-3 pt-0.5 md:max-w-[22rem]">
                <Link
                  href={primaryAction.href}
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[#e7ca55] bg-[#ffe16d] px-5 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-ink)]"
                >
                  {primaryAction.label}
                </Link>
                <Link
                  href={secondaryAction.href}
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur-[6px]"
                >
                  {secondaryAction.label}
                </Link>
              </div>
              <div className="mt-0.5 rounded-[0.875rem] border border-white/15 bg-[rgba(8,20,52,0.42)] px-[13px] py-[11px] backdrop-blur-[8px]">
                <div className="flex items-center justify-between gap-2.5">
                  <p className="font-serif text-[1.35rem] font-bold text-white">Inscribite ya!</p>
                  <span className="inline-flex items-center rounded-full border border-[rgba(255,225,109,0.5)] bg-[rgba(242,194,0,0.2)] px-[10px] py-[3px] font-serif text-[1rem] font-bold text-white">
                    {entryPrice}
                    <span className="ml-1 font-sans text-[9px] font-semibold uppercase tracking-[0.06em] text-[#cfe0ff]">
                      promo
                    </span>
                  </span>
                </div>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#cfe0ff]">
                    Hasta
                  </span>
                  <p className="font-serif text-[1.65rem] font-bold text-[#ffe16d] [font-variant-numeric:tabular-nums]">
                    <PromoCountdownInline />
                  </p>
                </div>
                <p className="mt-[5px] text-[11px] leading-[15px] text-[#9fb6e6]">
                  Pozo incremental: crece con cada jugador.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 bg-[linear-gradient(180deg,#001a5c_0%,#042366_100%)] px-4 pb-[22px] md:px-8">
          <article className="rounded-[0.75rem] border border-white/14 bg-white/5 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9fb6e6]">
              Pozo inicial
            </p>
            <p className="mt-2.5 font-serif text-[2rem] font-bold leading-none text-white">
              {homeDisplayMetrics.prizePoolLabel}
            </p>
          </article>
          <article className="rounded-[0.75rem] border border-white/14 bg-white/5 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9fb6e6]">
              Jugadores
            </p>
            <p className="mt-2.5 font-serif text-[2rem] font-bold leading-none text-white">
              {homeDisplayMetrics.playersLabel}
            </p>
          </article>
        </section>
      </div>

      <div className="-mx-4 -mt-5 rounded-t-[1.75rem] bg-[linear-gradient(180deg,#fbfcfe_0%,var(--color-bg)_16%,#f5f6f8_100%)] px-4 pb-24 pt-[26px] md:-mx-6 md:px-6">
        <section className="rounded-[1.25rem] border-[1.5px] border-[var(--color-line)] bg-white p-4 shadow-[0_10px_24px_rgba(0,50,125,0.05)] md:p-5">
          <div className="mb-4 md:mb-5">
            <h2 className="font-serif text-[1.6rem] font-bold leading-none text-[var(--color-ink)] md:text-[1.85rem]">
              Próximos partidos
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              Estos son los primeros cruces para cargar tu pronóstico.
            </p>
          </div>
          <div className="grid gap-3">
            {landingMatches.map((match, index) => (
              <div
                key={`${match.home.code}-${match.away.code}-${index}`}
                className="flex items-center justify-between gap-3 rounded-[0.75rem] border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <CountryFlag
                    country={match.home.name}
                    countryCode={match.home.countryCode}
                    label={match.home.name}
                    size="sm"
                    className="h-9 w-9 text-lg"
                  />
                  <span className="font-serif text-[1.25rem] font-bold text-[var(--color-ink)]">
                    {match.home.code}
                  </span>
                  <span className="text-xs font-semibold text-[var(--color-muted)]">vs</span>
                  <span className="font-serif text-[1.25rem] font-bold text-[var(--color-ink)]">
                    {match.away.code}
                  </span>
                  <CountryFlag
                    country={match.away.name}
                    countryCode={match.away.countryCode}
                    label={match.away.name}
                    size="sm"
                    className="h-9 w-9 text-lg"
                  />
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-primary)]">
                    Grupo {match.group}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--color-muted)]">{match.kickoff}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-[14px] grid gap-[14px]">
          {LANDING_STEPS.map((item) => (
            <article
              key={item.step}
              className="rounded-[1.25rem] border-[1.5px] border-[var(--color-line)] bg-white p-5 shadow-[0_10px_24px_rgba(0,50,125,0.05)]"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-primary)]">
                {item.step}
              </p>
              <h3 className="mt-3 font-serif text-[1.6rem] font-bold leading-none text-[var(--color-ink)]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{item.description}</p>
            </article>
          ))}
        </section>
      </div>
    </PageStack>
  );
}
