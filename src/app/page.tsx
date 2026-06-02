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
      <section className="-mx-4 -mt-2 overflow-hidden bg-[linear-gradient(180deg,#0047ab_0%,#00327d_100%)] sm:-mx-4">
        <div className="relative flex min-h-[430px] flex-col items-center justify-center px-4 pb-10 pt-8 text-center">
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_40%)]" />
          <div className="absolute inset-0 opacity-18 [background-image:linear-gradient(0deg,transparent_24%,rgba(255,255,255,0.08)_25%,rgba(255,255,255,0.08)_26%,transparent_27%,transparent_74%,rgba(255,255,255,0.08)_75%,rgba(255,255,255,0.08)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,rgba(255,255,255,0.08)_25%,rgba(255,255,255,0.08)_26%,transparent_27%,transparent_74%,rgba(255,255,255,0.08)_75%,rgba(255,255,255,0.08)_76%,transparent_77%,transparent)] [background-size:24px_24px]" />
          <div className="pointer-events-none absolute bottom-0 right-[-2rem] z-[1] opacity-[0.12]">
            <div className="relative h-[180px] w-[180px] mix-blend-multiply sm:hidden">
              <Image
                src="/home-banner-mobile.png"
                alt="Banner del Mundial para SoliProde"
                fill
                priority
                className="object-contain object-bottom-right"
                sizes="100vw"
              />
            </div>
            <div className="relative hidden h-[220px] w-[420px] mix-blend-multiply sm:block">
              <Image
                src="/home-banner-desktop.png"
                alt="Banner del Mundial para SoliProde"
                fill
                priority
                className="object-contain object-bottom-right"
                sizes="(min-width: 640px) 720px, 100vw"
              />
            </div>
          </div>
          <div className="absolute inset-0 z-[2] bg-[linear-gradient(180deg,rgba(0,0,0,0.02)_0%,rgba(0,0,0,0.06)_42%,rgba(0,0,0,0.18)_100%)]" />

          <div className="relative z-10 grid max-w-[17rem] gap-4">
            <h1 className="font-serif text-[2.35rem] font-bold uppercase leading-[0.92] text-white">
              Juga el Prode del Mundial
            </h1>
            <p className="text-[1.05rem] font-semibold leading-7 text-[#dfe6ff]">y competi por premios</p>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#e7ca55] bg-[#ffe16d] px-6 py-4 text-sm font-bold uppercase tracking-[0.08em] text-[#1a1c1c]"
            >
              Crear cuenta y jugar
            </Link>
          </div>
        </div>
      </section>

      <section className="-mt-3 grid grid-cols-2 gap-3">
        {impactMetrics.map((metric) => (
          <SurfaceCard key={metric.label}>
            <div className="text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                {metric.label}
              </p>
              <p className="mt-2 font-serif text-[2.2rem] font-bold leading-none text-[var(--color-primary)]">
                {metric.value}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{metric.detail}</p>
            </div>
          </SurfaceCard>
        ))}
      </section>

      <section className="grid gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-[2rem] font-bold text-[var(--color-ink)]">Proximo Partido</h2>
          <Link href="/matches" className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--color-secondary)]">
            Ver todos
          </Link>
        </div>
        <div className="overflow-hidden rounded-lg border-[1.5px] border-[var(--color-primary)] bg-[var(--color-surface)]">
          <div className="bg-[var(--color-primary)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
            Fase de grupos • Hoy 16:00
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 p-4">
            <div className="text-center">
              <CountryFlag country="ARG" label="Argentina" size="sm" className="mx-auto mb-2" />
              <p className="font-serif text-[1.9rem] font-bold uppercase leading-none">ARG</p>
            </div>
            <div className="rounded-md border-[1.5px] border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3 font-serif text-[1.6rem] font-bold text-[var(--color-muted)]">
              VS
            </div>
            <div className="text-center">
              <CountryFlag country="BRA" label="Brasil" size="sm" className="mx-auto mb-2" />
              <p className="font-serif text-[1.9rem] font-bold uppercase leading-none">BRA</p>
            </div>
          </div>
        </div>
      </section>

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

      <section className="px-4 py-2 text-center">
        <p className="mx-auto max-w-[18rem] text-sm leading-6 text-[var(--color-muted)]">
          El 20% del pozo recaudado se destina a una causa solidaria real.
        </p>
      </section>
    </PageStack>
  );
}
