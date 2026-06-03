import Image from "next/image";
import Link from "next/link";
import { PromoCountdown } from "@/components/home/promo-countdown";
import { FlowStep, PageStack } from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";
import {
  appendPromoterQuery,
  readPromoterCodeFromSearchParams,
} from "@/lib/auth/promoter-attribution";
import { getServerSessionState } from "@/lib/auth/session-state";
import { entryConfig, formatEntryPrice } from "@/lib/product/entry-config";
import { getHomeDisplayMetrics } from "@/lib/product/home-display";

const gameFlow = [
  {
    step: "Visitante",
    title: "Entrá al Prode",
    description: "Creás tu cuenta, elegís alias y empezás a vivir el Mundial desde el celular.",
  },
  {
    step: "Registrado",
    title: "Cargás tus pronósticos",
    description: "Guardás tus resultados y armás tu jugada antes de completar el Pase Solidario.",
  },
  {
    step: "Jugador activo",
    title: "Aporte confirmado",
    description: "Tus pronósticos entran al ranking y competís por el premio y la gloria.",
  },
];

const teamRules = [
  "Team de 11 amigos. Gloria en juego.",
  "El Capitán arma el equipo. El DT se gana el puesto sumando puntos.",
  "Plantel amplio: para el ranking suman los mejores 11 Jugadores activos.",
];

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
  const loginHref = appendPromoterQuery("/login", promoterCode);
  const registerHref = appendPromoterQuery("/register", promoterCode);
  const flowItems = sessionState.isPaid
    ? [
        {
          step: "Partidos",
          title: "Cargás tus pronósticos",
          description: "Cada partido es una chance de sumar puntos y pegar un pleno.",
        },
        {
          step: "Ranking",
          title: "Subís en la tabla",
          description: "Tus aciertos te empujan en el ranking general y dentro de tu Team.",
        },
        {
          step: "Premios",
          title: "Competís de verdad",
          description: "Sos Jugador activo. Ahora la jugada es sostener el ritmo y ganar.",
        },
      ]
    : gameFlow;
  const heroState = !sessionState.isAuthenticated
    ? {
        status: "Visitante",
        title: "Jugá el Mundial. Llevate todo.",
        description: "Pronosticá cada partido, sumá puntos y armá tu Team para pelear por la gloria.",
        detail: "Además bancás a universitarios a terminar su carrera.",
        primaryHref: registerHref,
        primaryLabel: "Entrá al Prode",
        secondaryHref: loginHref,
        secondaryLabel: "Ya tengo cuenta",
      }
    : sessionState.isPaid
      ? {
          status: "Jugador activo",
          title: "Jugá el Mundial. Llevate todo.",
          description: "Cargá tus pronósticos, peleá el ranking y empujá a tu Team.",
          detail: "Aporte confirmado: ya competís por el premio y la gloria.",
          primaryHref: "/matches",
          primaryLabel: "Cargá tus pronósticos",
          secondaryHref: "/rankings",
          secondaryLabel: "Ver ranking",
        }
      : {
          status: "Registrado",
          title: "Jugá el Mundial. Llevate todo.",
          description: "Tus pronósticos quedan guardados. Completá tu Pase Solidario para competir.",
          detail: "Cuando el aporte quede confirmado pasás a Jugador activo.",
          primaryHref: "/dashboard",
          primaryLabel: "Completá tu inscripción para jugar",
          secondaryHref: "/matches",
          secondaryLabel: "Cargá tus pronósticos",
        };

  return (
    <PageStack>
      <section className="-mt-2 overflow-hidden rounded-[2rem] bg-[#001a5c] md:-mx-6">
        <div className="relative flex min-h-[500px] flex-col items-center justify-end px-4 pb-7 text-center md:min-h-[36rem] md:px-8 md:pb-12">
          <Image
            src="/lio_copa.jpeg"
            alt="Lionel Messi con la Copa del Mundo"
            fill
            priority
            className="object-cover object-[55%_18%]"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,transparent_48%,rgba(0,26,92,0.65)_65%,rgba(0,26,92,0.95)_80%,#001a5c_100%)]" />
          <div className="relative z-10 grid w-full max-w-[19.5rem] gap-3 md:max-w-[46rem] md:gap-4">
            <p className="mx-auto rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#dfe6ff] backdrop-blur">
              {heroState.status}
            </p>
            <h1 className="mx-auto max-w-[18rem] break-words font-serif text-[2.55rem] font-bold uppercase leading-[0.88] text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.7)] sm:max-w-[20rem] sm:text-[2.85rem] md:max-w-[38rem] md:text-[5rem]">
              <span className="block">Jugá el</span>
              <span className="block">Mundial</span>
              <span className="mt-1 block text-[#ffe16d]">Llevate todo</span>
            </h1>
            <p className="mx-auto max-w-[17rem] text-[0.95rem] font-medium leading-6 text-[#dfe6ff] drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)] md:max-w-[34rem] md:text-[1.2rem] md:leading-7">
              {heroState.description}
            </p>
            <p className="mx-auto max-w-[16rem] text-[0.72rem] font-normal leading-5 text-[#9aafd4] md:max-w-[34rem] md:text-[0.9rem] md:leading-6">
              {heroState.detail}
            </p>
            <div className="mt-1 grid gap-3 md:mx-auto md:w-full md:max-w-[34rem] md:grid-cols-[1.25fr_1fr]">
              <Link
                href={heroState.primaryHref}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#e7ca55] bg-[#ffe16d] px-5 py-4 text-center text-sm font-bold uppercase tracking-[0.08em] text-[#1a1c1c] shadow-[0_16px_30px_rgba(0,0,0,0.22)]"
              >
                {heroState.primaryLabel}
              </Link>
              <Link
                href={heroState.secondaryHref}
                className="inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/10 px-6 py-3 text-sm font-bold uppercase tracking-[0.08em] text-white"
              >
                {heroState.secondaryLabel}
              </Link>
            </div>
            <div className="mt-3 grid gap-3 text-left md:mx-auto md:w-full md:max-w-[46rem] md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.8fr)]">
              <PromoCountdown />
              <div className="rounded-[1rem] border border-white/14 bg-white/10 px-4 py-4 shadow-[0_12px_24px_rgba(0,0,0,0.14)] backdrop-blur-[2px]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#dfe6ff]">
                  Pozo inicial
                </p>
                <p className="mt-2 font-serif text-[1.9rem] font-bold leading-none text-white sm:text-[2.25rem]">
                  {homeDisplayMetrics.prizePoolLabel}
                </p>
              </div>
              <div className="rounded-[1rem] border border-white/14 bg-white/10 px-4 py-4 shadow-[0_12px_24px_rgba(0,0,0,0.14)] backdrop-blur-[2px]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#dfe6ff]">
                  Jugadores
                </p>
                <p className="mt-2 font-serif text-[1.9rem] font-bold leading-none text-white sm:text-[2.25rem]">
                  {homeDisplayMetrics.playersLabel}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid min-w-0 gap-4 rounded-[1.75rem] bg-[linear-gradient(180deg,#fbfcfe_0%,var(--color-bg)_40%,#f5f6f8_100%)] pt-4 md:px-5 md:pt-6">
        <div className="grid min-w-0 gap-4 md:grid-cols-[1.2fr_0.8fr]">
          <SurfaceCard
            title="Creá tu Team de 11 amigos y compitan por la gloria"
            description="El Mundial se juega mejor con Plantel, ranking y picante interno."
          >
            <div className="grid gap-3">
              {teamRules.map((rule) => (
                <p
                  key={rule}
                  className="min-w-0 break-words rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3 text-[13px] font-medium leading-5 text-[var(--color-ink)]"
                >
                  {rule}
                </p>
              ))}
              <p className="min-w-0 break-words rounded-lg border border-[var(--color-gold)] bg-[rgba(255,225,109,0.14)] px-4 py-3 text-[13px] font-semibold leading-5 text-[var(--color-ink)]">
                El Team puede tener un Plantel amplio. Para el ranking suman los mejores 11 Jugadores activos.
              </p>
            </div>
          </SurfaceCard>
          <SurfaceCard
            title="Solidario, sin solemnidad"
            description="También hay una razón atrás del juego."
            tone="accent"
          >
            <p className="text-sm leading-6 text-[var(--color-ink)]">
              Además bancás a universitarios a terminar su carrera. SoliProde es una creación sin fines de lucro.
            </p>
          </SurfaceCard>
        </div>
      </section>

      {!sessionState.isAuthenticated ? (
        <SurfaceCard title="Completá tu inscripción para jugar" description="Entrás gratis, cargás pronósticos y después activás tu Pase Solidario para competir.">
          <div className="grid gap-4">
            <div className="rounded-lg border-[1.5px] border-[var(--color-gold)] bg-[rgba(255,225,109,0.14)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                Pase Solidario
              </p>
              <p className="mt-2 font-serif text-[2.4rem] font-bold leading-none text-[var(--color-primary)]">
                {entryPrice}
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                Entrás al Prode, cargás tus pronósticos y activás tu lugar cuando quieras competir.
              </p>
            </div>
            <PromoCountdown variant="surface" />

            <p className="text-sm leading-6 text-[var(--color-muted)]">
              Tus pronósticos se pueden cargar gratis. Después completás tu inscripción para que entren al ranking general y peleen premios.
            </p>
          </div>
        </SurfaceCard>
      ) : sessionState.isPaid ? (
        <SurfaceCard title="Premio en juego" description="Sos Jugador activo. Ahora el foco es sumar puntos y subir en la tabla.">
          <div className="grid gap-4">
            <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                Aporte confirmado
              </p>
              <p className="mt-2 font-serif text-[2rem] font-bold uppercase leading-none text-[var(--color-primary)]">
                Jugador activo
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                Cargá tus pronósticos, seguí el ranking y empujá a tu Team desde el celular.
              </p>
            </div>
          </div>
        </SurfaceCard>
      ) : (
        <SurfaceCard title="Completá tu inscripción para jugar" description="Como Registrado, podés cargar pronósticos. El Pase Solidario los mete a competir.">
          <div className="grid gap-4">
            <div className="rounded-lg border-[1.5px] border-[var(--color-gold)] bg-[rgba(255,225,109,0.14)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                Pase Solidario
              </p>
              <p className="mt-2 font-serif text-[2.4rem] font-bold leading-none text-[var(--color-primary)]">
                {entryPrice}
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                Tus pronósticos quedan guardados. Completá tu inscripción para que entren al ranking y peleen premios.
              </p>
            </div>
            <PromoCountdown variant="surface" />

            <p className="text-sm leading-6 text-[var(--color-muted)]">
              Tus pronósticos quedan guardados. Completá tu inscripción para que compitan por premios y ranking.
            </p>
          </div>
        </SurfaceCard>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        {flowItems.map((item) => (
          <FlowStep
            key={item.step}
            step={item.step}
            title={item.title}
            description={item.description}
          />
        ))}
      </section>

      {!sessionState.isPaid ? (
        <SurfaceCard title="Cómo entrás a competir" description="Primero jugás como Registrado. Después completás el Pase Solidario.">
          <div className="grid gap-3 text-sm leading-6 text-[var(--color-muted)]">
            <p>1. Entrás como Visitante y creás tu cuenta.</p>
            <p>2. Como Registrado, cargás tus pronósticos.</p>
            <p>3. Completás tu inscripción para jugar.</p>
            <p>4. Con el aporte confirmado sos Jugador activo y competís por premios.</p>
          </div>
        </SurfaceCard>
      ) : (
        <SurfaceCard title="Tu próxima jugada" description="Como Jugador activo, las acciones que importan ahora son Partidos y Ranking.">
          <div className="grid gap-3 text-sm leading-6 text-[var(--color-muted)]">
            <p>1. Cargá tus pronósticos antes de cada partido.</p>
            <p>2. Sumá puntos con cada resultado.</p>
            <p>3. Empujá a tu Team y subí en el ranking general.</p>
          </div>
        </SurfaceCard>
      )}
    </PageStack>
  );
}
