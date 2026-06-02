import Image from "next/image";
import Link from "next/link";
import { EntryCountdown } from "@/components/payments/entry-countdown";
import { MercadoPagoBadge } from "@/components/payments/mercado-pago-badge";
import { FlowStep, PageStack } from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";
import {
  appendPromoterQuery,
  readPromoterCodeFromSearchParams,
} from "@/lib/auth/promoter-attribution";
import { getServerSessionState } from "@/lib/auth/session-state";
import { entryConfig, formatEntryPrice } from "@/lib/product/entry-config";

const gameFlow = [
  {
    step: "Paso 1",
    title: "Creás tu cuenta",
    description: "Entrás gratis, elegís tu alias y empezás a jugar sin pagar al registrarte.",
  },
  {
    step: "Paso 2",
    title: "Cargás tus pronósticos",
    description: "Guardás picks como borrador y preparás tu torneo desde el celular.",
  },
  {
    step: "Paso 3",
    title: "Pagás y competís",
    description: "Pagás con Mercado Pago y tus pronósticos pasan a competir por premios y rankings.",
  },
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
          description: "Tus aciertos te empujan en el ranking general y dentro de tu grupo.",
        },
        {
          step: "Premios",
          title: "Competís de verdad",
          description: "Ya estás en carrera. Ahora la jugada es sostener el ritmo y ganar.",
        },
      ]
    : gameFlow;
  const heroState = !sessionState.isAuthenticated
    ? {
        eyebrow: "Entrá al Mundial",
        title: "Jugá el Mundial y llevate todo!",
        description: "Jugá el Prode del Mundial, sumá puntos y ganale a tu grupo.",
        detail: "Jugás por premios. También ayudás a financiar una tesis universitaria.",
        primaryHref: registerHref,
        primaryLabel: "Crear cuenta y jugar",
        secondaryHref: loginHref,
        secondaryLabel: "Ya tengo cuenta",
      }
    : sessionState.isPaid
      ? {
          eyebrow: "Ya estás adentro",
          title: "Ya estás compitiendo",
          description: "Cargá tus pronósticos, peleá el ranking y ganale a tu grupo.",
          detail: "Tu lugar ahora está en Partidos y Ranking.",
          primaryHref: "/matches",
          primaryLabel: "Ver partidos",
          secondaryHref: "/rankings",
          secondaryLabel: "Ver ranking",
        }
      : {
          eyebrow: "Volvé al juego",
          title: "Tus picks ya te están esperando",
          description: "Tus pronósticos pueden quedar guardados. Pagá para que compitan por premios.",
          detail: "Volvé al panel, cargá tus picks y activalos con Mercado Pago.",
          primaryHref: "/dashboard",
          primaryLabel: "Ir al panel",
          secondaryHref: "/matches",
          secondaryLabel: "Cargar pronósticos",
        };

  return (
    <PageStack>
      <section className="-mx-4 -mt-2 overflow-hidden bg-[#001a5c] sm:-mx-4">
        <div className="relative flex min-h-[540px] flex-col items-center justify-end px-4 pb-10 text-center">
          <Image
            src="/lio_copa.jpeg"
            alt="Lionel Messi con la Copa del Mundo"
            fill
            priority
            className="object-cover object-[55%_18%]"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,transparent_48%,rgba(0,26,92,0.65)_65%,rgba(0,26,92,0.95)_80%,#001a5c_100%)]" />
          <div className="relative z-10 grid max-w-[19rem] gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#dfe6ff]">
              {heroState.eyebrow}
            </p>
            <h1 className="font-serif text-[2.5rem] font-bold uppercase leading-[0.9] text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.7)]">
              {heroState.title}
            </h1>
            <p className="text-[0.95rem] font-medium leading-6 text-[#dfe6ff] drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)]">
              {heroState.description}
            </p>
            <p className="text-[0.72rem] font-normal leading-5 text-[#9aafd4]">
              {heroState.detail}
            </p>
            <div className="mt-1 grid gap-3">
              <Link
                href={heroState.primaryHref}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#e7ca55] bg-[#ffe16d] px-6 py-4 text-sm font-bold uppercase tracking-[0.08em] text-[#1a1c1c]"
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
          </div>
        </div>
      </section>

      {!sessionState.isAuthenticated ? (
        <SurfaceCard title="Inscripción inicial" description="Entrás gratis, cargás picks y después pagás para competir por premios.">
          <div className="grid gap-4">
            <div className="rounded-lg border-[1.5px] border-[var(--color-gold)] bg-[rgba(255,225,109,0.14)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                Inscripción inicial
              </p>
              <p className="mt-2 font-serif text-[2.4rem] font-bold leading-none text-[var(--color-primary)]">
                {entryPrice}
              </p>
              <div className="mt-3">
                <EntryCountdown />
              </div>
            </div>

            <MercadoPagoBadge compact secondaryText="Pago online seguro" />

            <p className="text-sm leading-6 text-[var(--color-muted)]">
              Tus pronósticos se pueden cargar gratis. Para que entren al ranking general y peleen premios, pagás con Mercado Pago.
            </p>
          </div>
        </SurfaceCard>
      ) : sessionState.isPaid ? (
        <SurfaceCard title="Premio en juego" description="Ya estás adentro. Ahora el foco es sumar puntos y subir en la tabla.">
          <div className="grid gap-4">
            <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                Estado del juego
              </p>
              <p className="mt-2 font-serif text-[2rem] font-bold uppercase leading-none text-[var(--color-primary)]">
                Ya estás compitiendo
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                Cargá tus pronósticos, seguí el ranking y ganale a tu grupo desde el celular.
              </p>
            </div>
          </div>
        </SurfaceCard>
      ) : (
        <SurfaceCard title="Tus picks ya pueden jugar" description="Volvé al panel, cargá pronósticos y activalos cuando quieras pelear premios.">
          <div className="grid gap-4">
            <div className="rounded-lg border-[1.5px] border-[var(--color-gold)] bg-[rgba(255,225,109,0.14)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                Activá tus picks
              </p>
              <p className="mt-2 font-serif text-[2.4rem] font-bold leading-none text-[var(--color-primary)]">
                {entryPrice}
              </p>
              <div className="mt-3">
                <EntryCountdown />
              </div>
            </div>

            <MercadoPagoBadge compact secondaryText="Pagá online y entrá a competir" />

            <p className="text-sm leading-6 text-[var(--color-muted)]">
              Tus pronósticos pueden quedar guardados. Pagá con Mercado Pago para que compitan por premios y ranking.
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
        <SurfaceCard title="Cómo entrás a competir" description="El registro es gratis. El pago aparece cuando ya tenés claro qué estás activando.">
          <div className="grid gap-3 text-sm leading-6 text-[var(--color-muted)]">
            <p>1. Creás tu cuenta gratis.</p>
            <p>2. Guardás pronósticos como borrador.</p>
            <p>3. Pagás con Mercado Pago.</p>
            <p>4. Tus pronósticos entran a competir por premios y ranking oficial.</p>
          </div>
        </SurfaceCard>
      ) : (
        <SurfaceCard title="Tu próxima jugada" description="Con la cuenta activa, las acciones que importan ahora son Partidos y Ranking.">
          <div className="grid gap-3 text-sm leading-6 text-[var(--color-muted)]">
            <p>1. Cargá tus pronósticos antes de cada partido.</p>
            <p>2. Sumá puntos con cada resultado.</p>
            <p>3. Ganale a tu grupo y subí en el ranking general.</p>
          </div>
        </SurfaceCard>
      )}
    </PageStack>
  );
}
