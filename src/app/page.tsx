import Image from "next/image";
import Link from "next/link";
import { CountryFlag } from "@/components/country-flag";
import { FlowStep, PageStack } from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";

const impactMetrics = [
  {
    value: "$1.5M",
    label: "pozo proyectado",
    detail: "El juego combina competencia, premios y una causa solidaria real.",
  },
  {
    value: "12.4K",
    label: "jugadores esperados",
    detail: "La experiencia está pensada para moverse rápido desde el celular.",
  },
];

const gameFlow = [
  {
    step: "Paso 1",
    title: "Creás tu cuenta",
    description: "Elegís tu alias, confirmás tu email y ya podés entrar al torneo.",
  },
  {
    step: "Paso 2",
    title: "Cargás tus pronósticos",
    description: "Vas a encontrar tus partidos abiertos en una pantalla simple y rápida.",
  },
  {
    step: "Paso 3",
    title: "Seguís tu posición",
    description: "Comparás tu rendimiento en la tabla general, tu grupo y tu comunidad.",
  },
];

export default function Home() {
  return (
    <PageStack>
      <section className="-mx-4 -mt-4 flex min-h-[560px] flex-col overflow-hidden bg-[linear-gradient(180deg,#0047ab_0%,#00327d_100%)] sm:-mx-4">
        <div className="relative flex flex-1 flex-col justify-end p-4 pb-8 text-center">
          <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_top,rgba(255,255,255,0.22),transparent_42%)]" />
          <div className="absolute inset-x-0 top-0 z-[1] flex justify-center">
            <div className="relative h-[320px] w-full max-w-[430px] sm:hidden">
              <Image
                src="/home-banner-mobile.png"
                alt="Banner del Mundial para SoliProde"
                fill
                priority
                className="object-contain object-top"
                sizes="100vw"
              />
            </div>
            <div className="relative hidden h-[360px] w-full max-w-[880px] sm:block">
              <Image
                src="/home-banner-desktop.png"
                alt="Banner del Mundial para SoliProde"
                fill
                priority
                className="object-contain object-top"
                sizes="(min-width: 640px) 880px, 100vw"
              />
            </div>
          </div>
          <div className="absolute inset-0 z-[2] bg-[linear-gradient(180deg,rgba(0,0,0,0.02)_0%,rgba(0,0,0,0.32)_68%,rgba(0,0,0,0.52)_100%)]" />
          <div className="relative z-10 mt-auto">
            <h1 className="font-serif text-[2.5rem] font-bold uppercase leading-[0.95] tracking-[-0.03em] text-white">
              Jugá el Prode del Mundial
            </h1>
            <p className="mt-2 text-lg leading-7 text-[#dfe6ff]">y competí por premios</p>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-gold-soft)] px-6 py-4 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-ink)] shadow-[0_0_20px_rgba(255,225,109,0.4)] transition hover:brightness-105"
              >
                Crear cuenta y jugar
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/8 px-5 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-white"
              >
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="-mt-8 grid grid-cols-2 gap-3">
        {impactMetrics.map((metric) => (
          <SurfaceCard key={metric.label}>
            <div className="flex flex-col items-center justify-center text-center">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(154,225,255,0.2)] text-[var(--color-primary)]">
                <span className="font-serif text-2xl font-bold">{metric.value === "$1.5M" ? "$" : "#"}</span>
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                {metric.label}
              </p>
              <p className="mt-1 font-serif text-[2rem] font-bold leading-none text-[var(--color-primary)]">
                {metric.value}
              </p>
            </div>
          </SurfaceCard>
        ))}
      </section>

      <SurfaceCard
        title="Próximo partido"
        description="Cuando el fixture esté cargado, el acceso principal del jugador va a aparecer acá."
      >
        <div className="overflow-hidden rounded-xl border-[1.5px] border-[var(--color-primary)] bg-[var(--color-surface)]">
          <div className="bg-[var(--color-primary)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
            Fase de grupos • Hoy 16:00
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 bg-gradient-to-b from-[var(--color-surface)] to-[var(--color-surface-muted)] p-4">
            <div className="text-center">
              <CountryFlag country="ARG" label="Argentina" size="md" className="mx-auto mb-2" />
              <p className="font-serif text-[1.9rem] font-bold uppercase leading-none">ARG</p>
            </div>
            <div className="rounded-lg border-[1.5px] border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3 font-serif text-[1.8rem] font-bold text-[var(--color-muted)]">
              VS
            </div>
            <div className="text-center">
              <CountryFlag country="BRA" label="Brasil" size="md" className="mx-auto mb-2" />
              <p className="font-serif text-[1.9rem] font-bold uppercase leading-none">BRA</p>
            </div>
          </div>
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

      <SurfaceCard tone="accent">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-[2.3rem] font-bold uppercase leading-[0.95] text-[var(--color-ink)]">
            El 20% del pozo acompaña una causa concreta.
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--color-muted)] sm:text-base">
            SoliProde junta la energía del Mundial con una meta solidaria real. Jugás por tu
            posición, por tu grupo y también por algo más grande.
          </p>
        </div>
      </SurfaceCard>
    </PageStack>
  );
}
