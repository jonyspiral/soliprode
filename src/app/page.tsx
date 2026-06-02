import Image from "next/image";
import Link from "next/link";
import { EntryCountdown } from "@/components/payments/entry-countdown";
import { MercadoPagoBadge } from "@/components/payments/mercado-pago-badge";
import { FlowStep, PageStack } from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";
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

export default function Home() {
  const entryPrice = formatEntryPrice(entryConfig.initialPrice);

  return (
    <PageStack>
      <section className="-mx-4 -mt-2 overflow-hidden bg-[linear-gradient(180deg,#0047ab_0%,#00327d_100%)] sm:-mx-4">
        <div className="relative flex min-h-[520px] flex-col justify-between overflow-hidden px-4 pb-6 pt-6 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_42%)]" />
          <div className="absolute inset-x-0 bottom-0 h-[46%] bg-[linear-gradient(180deg,rgba(0,50,125,0)_0%,rgba(0,50,125,0.28)_36%,rgba(0,50,125,0.8)_78%,#00327d_100%)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 mx-auto flex max-w-md items-end justify-center px-2">
            <div className="relative h-[210px] w-full max-w-[340px]">
              <Image
                src="/home-banner-mobile-clean.png"
                alt="Jugador levantando la Copa del Mundo"
                fill
                priority
                className="object-contain object-bottom sm:hidden"
                sizes="340px"
              />
              <Image
                src="/home-banner-desktop-clean.png"
                alt="Jugador levantando la Copa del Mundo"
                fill
                priority
                className="hidden object-contain object-bottom sm:block"
                sizes="340px"
              />
            </div>
          </div>
          <div className="relative z-10 grid justify-items-center gap-3">
            <h1 className="font-serif text-[2.5rem] font-bold uppercase leading-[0.9] text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.7)]">
              Jugá el Prode del Mundial
            </h1>
            <p className="text-[0.95rem] font-medium leading-6 text-[#dfe6ff] drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)]">
              Creás tu cuenta gratis, cargás tus pronósticos y pagás para competir por premios.
            </p>
            <p className="max-w-[18rem] text-[0.72rem] font-normal leading-5 text-[#cbd8ff]">
              Competís por premios, ranking y grupo. La capa solidaria acompaña, pero el juego va primero.
            </p>
            <Link
              href="/register"
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg border border-[#e7ca55] bg-[#ffe16d] px-6 py-4 text-sm font-bold uppercase tracking-[0.08em] text-[#1a1c1c]"
            >
              Crear cuenta y jugar
            </Link>
          </div>
        </div>
      </section>

      <SurfaceCard title="Inscripción inicial" description="El pago principal del torneo es online y se comunica desde el primer contacto.">
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
            Para competir por premios, rankings individuales y la tabla de grupos, pagás online con Mercado Pago.
          </p>
        </div>
      </SurfaceCard>

      <section className="grid gap-4 md:grid-cols-3">
        {gameFlow.map((item) => (
          <FlowStep
            key={item.step}
            step={item.step}
            title={item.title}
            description={item.description}
          />
        ))}
      </section>

      <SurfaceCard title="Cómo entra el pago" description="El registro sigue siendo gratis. El pago aparece cuando el jugador ya entendió el juego.">
        <div className="grid gap-3 text-sm leading-6 text-[var(--color-muted)]">
          <p>1. Creás tu cuenta gratis.</p>
          <p>2. Guardás pronósticos como borrador.</p>
          <p>3. Pagás con Mercado Pago.</p>
          <p>4. Tus pronósticos pasan a competir por premios y rankings oficiales.</p>
        </div>
      </SurfaceCard>
    </PageStack>
  );
}
