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
      <section className="-mx-4 -mt-4 overflow-hidden rounded-b-[2rem] bg-[linear-gradient(180deg,#0047ab_0%,#00327d_100%)] shadow-[0_18px_42px_rgba(0,50,125,0.28)] sm:-mx-4">
        <div className="relative flex min-h-[620px] flex-col justify-between px-4 pb-8 pt-4">
          <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_top,rgba(255,255,255,0.22),transparent_44%)]" />
          <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(0deg,transparent_24%,rgba(255,255,255,0.08)_25%,rgba(255,255,255,0.08)_26%,transparent_27%,transparent_74%,rgba(255,255,255,0.08)_75%,rgba(255,255,255,0.08)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,rgba(255,255,255,0.08)_25%,rgba(255,255,255,0.08)_26%,transparent_27%,transparent_74%,rgba(255,255,255,0.08)_75%,rgba(255,255,255,0.08)_76%,transparent_77%,transparent)] [background-size:26px_26px]" />
          <div className="relative z-10 flex items-start justify-between gap-3">
            <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#dfe6ff]">
              Prode Mundial Solidario 2026
            </div>
            <div className="rounded-full bg-[var(--color-gold-soft)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink)]">
              Athletic pool
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-14 z-[1] flex justify-center">
            <div className="relative h-[360px] w-full max-w-[430px] sm:hidden">
              <Image
                src="/home-banner-mobile.png"
                alt="Banner del Mundial para SoliProde"
                fill
                priority
                className="object-contain object-top mix-blend-screen"
                sizes="100vw"
              />
            </div>
            <div className="relative hidden h-[430px] w-full max-w-[980px] sm:block">
              <Image
                src="/home-banner-desktop.png"
                alt="Banner del Mundial para SoliProde"
                fill
                priority
                className="object-contain object-top mix-blend-screen"
                sizes="(min-width: 640px) 980px, 100vw"
              />
            </div>
          </div>
          <div className="absolute inset-0 z-[2] bg-[linear-gradient(180deg,rgba(0,0,0,0.02)_10%,rgba(0,0,0,0.16)_52%,rgba(0,0,0,0.54)_100%)]" />

          <div className="relative z-10 mt-auto grid gap-6">
            <div className="max-w-[20rem]">
              <h1 className="font-serif text-[2.7rem] font-bold uppercase leading-[0.92] tracking-[-0.04em] text-white">
                Jugá el Mundial y subí en la tabla.
              </h1>
              <p className="mt-3 text-base leading-7 text-[#dfe6ff]">
                Cargá tus pronósticos, compará tu posición y ayudá a financiar una tesis con cada participación.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-gold-soft)] px-6 py-4 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-ink)] shadow-[0_0_20px_rgba(255,225,109,0.4)] transition hover:brightness-105"
              >
                Crear cuenta y jugar
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/8 px-5 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-white"
              >
                Ya tengo cuenta
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {impactMetrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#dfe6ff]">
                    {metric.label}
                  </p>
                  <p className="mt-2 font-serif text-[2rem] font-bold leading-none text-[var(--color-gold-soft)]">
                    {metric.value}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-[#dfe6ff]">{metric.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SurfaceCard
        title="Próximo partido"
        description="El fixture va a quedar al frente de la experiencia. Esta tarjeta marca el ritmo del home."
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
          <h2 className="font-serif text-[2.1rem] font-bold uppercase leading-[0.95] text-[var(--color-ink)]">
            Competís por tu lugar y también por una causa concreta.
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
