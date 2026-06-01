import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import {
  FlowStep,
  HighlightMetric,
  PageStack,
  ScopeCard,
} from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";

const impactMetrics = [
  {
    value: "1 tablero",
    label: "para jugar y seguir tus posiciones",
    detail: "Entrás, cargás tus pronósticos y volvés a ver cómo venís.",
  },
  {
    value: "3 niveles",
    label: "de competencia al mismo tiempo",
    detail: "General, grupo y comunidad con una sola base de puntos.",
  },
  {
    value: "1 causa",
    label: "que le da sentido al juego",
    detail: "Cada inscripción acompaña la financiación de una tesis.",
  },
];

const gameFlow = [
  {
    step: "Paso 1",
    title: "Creás tu cuenta",
    description: "Elegís tu alias, confirmás tu email y quedás listo para entrar al juego.",
  },
  {
    step: "Paso 2",
    title: "Cargás tus pronósticos",
    description: "Vas a encontrar tus partidos abiertos en una pantalla simple y rápida para móvil.",
  },
  {
    step: "Paso 3",
    title: "Seguís tu posición",
    description: "Podés comparar tu rendimiento en la tabla general, en tu grupo y en tu comunidad.",
  },
];

const playerBenefits = [
  {
    title: "Una experiencia clara",
    summary: "Todo está orientado a entrar rápido, pronosticar y volver a mirar cómo venís.",
    status: "Jugador",
    detail: "La app evita ruido técnico y prioriza las decisiones que importan durante el torneo.",
  },
  {
    title: "Competencia con contexto",
    summary: "No jugás solo contra todos: también competís con tu grupo y tu comunidad.",
    status: "Social",
    detail: "Eso le da identidad al juego sin complicar la lectura del ranking.",
  },
  {
    title: "Un motivo real para jugar",
    summary: "SoliProde junta competencia amistosa con una meta solidaria concreta.",
    status: "Solidario",
    detail: "La causa no aparece como adorno; es parte central de la propuesta.",
  },
];

export default function Home() {
  return (
    <PageStack>
      <PageHero
        title="Jugá el Mundial, competí con tu grupo y ayudá a financiar una tesis."
        description="SoliProde convierte el Prode Mundial Solidario 2026 en una experiencia simple para entrar, pronosticar y seguir tu posición desde el teléfono."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)]"
          >
            Crear cuenta
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full border border-[var(--color-line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            Ingresar
          </Link>
        </div>
      </PageHero>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <SurfaceCard tone="dark">
          <p className="text-sm leading-7 text-slate-200">
            SoliProde está pensado para que cualquier jugador entienda rápido qué hacer:
            registrarse, entrar al panel, cargar sus pronósticos y seguir su posición sin perderse
            entre módulos o pantallas técnicas.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {impactMetrics.map((metric) => (
              <HighlightMetric
                key={metric.label}
                value={metric.value}
                label={metric.label}
                detail={metric.detail}
              />
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard
          title="Qué vas a encontrar"
          description="Una base clara para jugar el torneo y seguir tu avance."
        >
          <div className="space-y-4">
            <div className="rounded-[1.25rem] border border-[var(--color-line)] bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-[var(--color-ink)]">Tu panel personal</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                Estado de tu cuenta, de tu inscripción y próximos pasos dentro del torneo.
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-[var(--color-line)] bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-[var(--color-ink)]">Tus partidos</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                Fixture abierto para cargar pronósticos de forma rápida y desde móvil.
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-[var(--color-line)] bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-[var(--color-ink)]">Tus posiciones</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                Ranking general, de grupo y de comunidad cuando el juego ya esté en marcha.
              </p>
            </div>
          </div>
        </SurfaceCard>
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

      <SurfaceCard
        title="Por qué se siente distinto"
        description="La experiencia está pensada para jugadores reales, no para navegar una demo del sistema."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {playerBenefits.map((item) => (
            <ScopeCard
              key={item.title}
              title={item.title}
              summary={item.summary}
              status={item.status}
              detail={item.detail}
            />
          ))}
        </div>
      </SurfaceCard>

      <SurfaceCard tone="accent">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h2 className="font-serif text-3xl leading-tight text-[var(--color-ink)]">
              Competí, seguí tus posiciones y ayudá a sostener una causa concreta.
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--color-muted)] sm:text-base">
              Si ya tenés cuenta, podés volver a ingresar. Si recién empezás, el siguiente paso es
              crear tu perfil y quedar listo para el fixture.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)]"
            >
              Empezar ahora
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full border border-[var(--color-line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </SurfaceCard>
    </PageStack>
  );
}
