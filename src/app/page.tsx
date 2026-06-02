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
            <h1 className="font-serif text-[2.5rem] font-bold uppercase leading-[0.9] text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.7)]">
              Juga el Mundial y llevate todo!
            </h1>
            <p className="text-[0.95rem] font-medium leading-6 text-[#dfe6ff] drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)]">
              Cargá tus pronósticos y participá por el premio que cada vez será más grande.
            </p>
            <p className="text-[0.72rem] font-normal leading-5 text-[#9aafd4]">
              Lo recaudado será destinado a financiar la tesis de estudiantes universitarios.
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
