import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import {
  ActionTile,
  FlowStep,
  HighlightMetric,
  PageStack,
  ScopeCard,
} from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";

const landingMetrics = [
  {
    value: "3 niveles",
    label: "competencia simultánea",
    detail: "General, grupo y comunidad con la misma base de puntos.",
  },
  {
    value: "Mobile first",
    label: "carga rápida de pronósticos",
    detail: "Pensado para abrir, predecir y seguir el ranking desde el teléfono.",
  },
  {
    value: "1 causa",
    label: "objetivo solidario concreto",
    detail: "El torneo acompaña la financiación de una tesis con una experiencia compartida.",
  },
];

const systemScopes = [
  {
    title: "Panel del jugador",
    summary: "Seguimiento personal con foco en el próximo partido, puntos y situación de inscripción.",
    status: "Base lista",
    detail: "El dashboard ya está planteado para crecer con puntos, predicciones, bonus y estado de pago.",
  },
  {
    title: "Competencia social",
    summary: "Grupos, oficinas y comunidades como capas de juego, no como afterthought.",
    status: "Modelo definido",
    detail: "La estructura contempla rankings paralelos y comparativas sin mezclar reglas ni vistas.",
  },
  {
    title: "Operación admin",
    summary: "Módulos reservados para usuarios, promotores, partidos, resultados y rankings.",
    status: "Shell armada",
    detail: "El sistema ya muestra la anatomía del backoffice para sumar operación real sin rediseño.",
  },
];

const gameFlow = [
  {
    step: "Paso 1",
    title: "Creás tu cuenta",
    description: "Entrás con email, definís tu alias público y quedás listo para competir.",
  },
  {
    step: "Paso 2",
    title: "Cargás tus pronósticos",
    description: "Cada partido abierto aparece en un flujo simple, rápido y natural para móvil.",
  },
  {
    step: "Paso 3",
    title: "Seguís tu posición",
    description: "Ves ranking general, de grupo y de comunidad sin perder contexto.",
  },
];

const moduleHighlights = [
  {
    title: "Matches",
    description: "Próximos partidos, estado de carga y espacios reservados para pronóstico rápido.",
    actionLabel: "Abrir partidos",
  },
  {
    title: "Rankings",
    description: "Comparativas separadas por alcance para que el juego escale sin confusión.",
    actionLabel: "Abrir rankings",
  },
  {
    title: "Comunidades",
    description: "Una superficie dedicada a oficinas, equipos y grupos organizados.",
    actionLabel: "Abrir comunidades",
  },
];

export default function Home() {
  return (
    <PageStack>
      <PageHero
        title="Jugá el Mundial, competí con tu grupo y ayudá a financiar una tesis."
        description="SoliProde convierte el Prode Mundial Solidario 2026 en una experiencia clara, rápida y organizada para jugadores, grupos, oficinas y comunidades."
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
          <Link
            href="/matches"
            className="inline-flex items-center justify-center rounded-full border border-[var(--color-line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            Ver partidos
          </Link>
        </div>
      </PageHero>

      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <SurfaceCard tone="dark">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-200">
            Prode Mundial Solidario 2026
          </p>
          <h2 className="mt-3 max-w-3xl font-serif text-3xl leading-tight sm:text-4xl">
            Un sistema pensado para que la competencia y la causa convivan en la misma experiencia.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
            La base actual ya separa panel de jugador, flujo de partidos, rankings por alcance y
            operación administrativa. El siguiente crecimiento suma lógica real sobre una estructura
            que ya está ordenada.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {landingMetrics.map((metric) => (
              <HighlightMetric
                key={metric.label}
                value={metric.value}
                label={metric.label}
                detail={metric.detail}
              />
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard title="Qué resuelve SoliProde" description="La plataforma ordena tres capas del juego desde el inicio.">
          <div className="space-y-4">
            {systemScopes.map((scope) => (
              <div key={scope.title} className="rounded-[1.25rem] border border-[var(--color-line)] bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-[var(--color-ink)]">{scope.title}</h3>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--color-accent)] ring-1 ring-[var(--color-line)]">
                    {scope.status}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{scope.summary}</p>
              </div>
            ))}
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

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <SurfaceCard
          title="Sistema preparado para escalar"
          description="Cada superficie principal ya tiene una responsabilidad clara dentro del producto."
        >
          <div className="grid gap-4">
            {systemScopes.map((scope) => (
              <ScopeCard
                key={scope.title}
                title={scope.title}
                summary={scope.summary}
                status={scope.status}
                detail={scope.detail}
              />
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard title="Módulos visibles hoy" description="La navegación actual ya muestra las piezas del sistema que van a crecer en las próximas iteraciones.">
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
            {moduleHighlights.map((item) => (
              <ActionTile
                key={item.title}
                title={item.title}
                description={item.description}
                actionLabel={item.actionLabel}
              />
            ))}
          </div>
        </SurfaceCard>
      </section>

      <SurfaceCard tone="accent">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h2 className="font-serif text-3xl leading-tight text-[var(--color-ink)]">
              La landing ya cuenta la propuesta y el sistema ya deja ver el producto.
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--color-muted)] sm:text-base">
              El próximo tramo natural es cerrar el circuito real de registro, login y primer uso
              del panel, y después conectar partidos, rankings y grupos sobre Supabase.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)]"
            >
              Ver panel
            </Link>
            <Link
              href="/admin"
              className="inline-flex items-center justify-center rounded-full border border-[var(--color-line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              Ver admin
            </Link>
          </div>
        </div>
      </SurfaceCard>
    </PageStack>
  );
}
