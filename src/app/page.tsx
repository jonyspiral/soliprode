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
      <section className="-mx-4 -mt-2 overflow-hidden bg-[#001a5c] sm:-mx-4">
        {/* Imagen en la mitad superior — altura fija para que Messi sea visible */}
        <div className="relative h-[300px] w-full sm:h-[340px]">
          <Image
            src="/lio_copa.jpeg"
            alt="Lionel Messi con la Copa del Mundo"
            fill
            priority
            className="object-cover object-[50%_18%]"
            sizes="100vw"
          />
          {/* Fade suave solo en el borde inferior de la imagen */}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,#001a5c_100%)]" />
        </div>
        {/* Texto y CTA sobre fondo azul */}
        <div className="flex flex-col items-center gap-3 px-4 pb-10 pt-1 text-center">
          <h1 className="font-serif text-[2.5rem] font-bold uppercase leading-[0.9] text-white">
            Juga el Mundial y llevate todo!
          </h1>
          <p className="max-w-[19rem] text-[0.95rem] font-medium leading-6 text-[#dfe6ff]">
            Cargá tus pronósticos y participá por el premio que cada vez será más grande.
          </p>
          <p className="max-w-[19rem] text-[0.72rem] font-normal leading-5 text-[#9aafd4]">
            Lo recaudado será destinado a financiar la tesis de estudiantes universitarios.
          </p>
          <Link
            href="/register"
            className="mt-1 w-full max-w-[19rem] inline-flex items-center justify-center gap-2 rounded-lg border border-[#e7ca55] bg-[#ffe16d] px-6 py-4 text-sm font-bold uppercase tracking-[0.08em] text-[#1a1c1c]"
          >
            Crear cuenta y jugar
          </Link>
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
