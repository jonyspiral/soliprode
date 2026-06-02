import Link from "next/link";
import { PageHero } from "@/components/page-hero";
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
      <PageHero
        tone="stadium"
        title="Jugá el Prode del Mundial"
        description="Competí con tu grupo, seguí tus posiciones y ayudá a financiar una tesis con una experiencia clara y móvil."
      >
        <div className="flex flex-col gap-3 sm:max-w-sm">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-lg bg-[var(--color-gold-soft)] px-5 py-4 text-base font-bold uppercase tracking-[0.08em] text-[var(--color-ink)] shadow-[0_10px_24px_rgba(233,196,0,0.26)] transition hover:brightness-105"
          >
            Crear cuenta y jugar
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/8 px-5 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-white/12"
          >
            Ya tengo cuenta
          </Link>
        </div>
      </PageHero>

      <section className="-mt-2 grid gap-4 sm:grid-cols-2">
        {impactMetrics.map((metric) => (
          <SurfaceCard key={metric.label}>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(154,225,255,0.2)] text-[var(--color-primary)]">
                <span className="font-serif text-2xl font-bold">{metric.value === "$1.5M" ? "$" : "#"}</span>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                  {metric.label}
                </p>
                <p className="mt-2 font-serif text-[2.1rem] font-bold leading-none text-[var(--color-primary)]">
                  {metric.value}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{metric.detail}</p>
              </div>
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
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 p-4">
            <div className="text-center">
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-lg border-2 border-[var(--color-line)] bg-[var(--color-surface-muted)] font-serif text-lg font-bold text-[var(--color-primary)]">
                ARG
              </div>
              <p className="font-serif text-[1.9rem] font-bold uppercase leading-none">ARG</p>
            </div>
            <div className="rounded-lg border-[1.5px] border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3 font-serif text-[1.8rem] font-bold text-[var(--color-muted)]">
              VS
            </div>
            <div className="text-center">
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-lg border-2 border-[var(--color-line)] bg-[var(--color-surface-muted)] font-serif text-lg font-bold text-[var(--color-primary)]">
                BRA
              </div>
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
