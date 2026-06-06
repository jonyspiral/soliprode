import Link from "next/link";
import { PageStack } from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";
import { appendPromoterQuery, readPromoterCodeFromSearchParams } from "@/lib/auth/promoter-attribution";
import { getServerSessionState } from "@/lib/auth/session-state";

const summaryCards = [
  {
    badge: "01",
    title: "Activá tu Pase",
    body: "Registrate, confirmá tu Aporte y pasá a ser Jugador activo para competir en el torneo.",
  },
  {
    badge: "5-3-0",
    title: "Sumá puntos",
    body: "Cada partido cierra cuando empieza. Podés modificar tu pronóstico hasta ese momento.",
    scores: [
      ["Resultado exacto", "5 pts"],
      ["Ganador o empate correcto", "3 pts"],
      ["Incorrecto", "0 pts"],
    ] as const,
  },
  {
    badge: "KO",
    title: "Eliminación directa",
    body: "En cruces mano a mano, además del marcador, tenés que elegir quién clasifica.",
    extra: "Si hay penales, los penales solo definen el clasificado. No cambian el marcador del partido.",
  },
  {
    badge: "11",
    title: "Armá tu Team",
    body: "Para competir como Team necesitan mínimo 7 jugadores activos. Para el ranking grupal puntúan los mejores 11.",
  },
  {
    badge: "$",
    title: "Premios",
    body: "Premio individual inicial de $300.000 ARS y creciendo con la recaudación.",
    extra: "El segundo puesto recibe el 10% del pozo individual a repartir. El tercero recibe medalla o premio sorpresa.",
  },
] as const;

const specialPredictions = [
  {
    title: "Campeón del Mundial",
    points: "20 pts",
    detail: "Cierra al inicio de octavos.",
  },
  {
    title: "Subcampeón",
    points: "10 pts",
    detail: "Cierra al inicio de octavos.",
  },
  {
    title: "¿Hasta dónde llega Argentina?",
    points: "10 pts",
    detail: "Cierre dinámico hasta octavos. Si Argentina no supera fase de grupos, este especial no suma puntos.",
  },
  {
    title: "Premios oficiales",
    points: "7 pts cada uno",
    detail: "Goleador / Bota de Oro, Balón de Oro, Mejor arquero y Mejor jugador joven. Cierran al inicio de cuartos.",
  },
] as const;

type RuleSection = {
  title: string;
  body: string;
  bullets?: readonly string[];
  ordered?: boolean;
};

const ruleSections: readonly RuleSection[] = [
  {
    title: "Participación",
    body: "Para participar tenés que ser mayor de 18 años, registrarte y activar tu Pase Solidario con un Aporte confirmado. La participación implica la aceptación del reglamento.",
  },
  {
    title: "Ingreso tardío",
    body: "Podés sumarte aunque el torneo ya haya empezado, hasta el 3 de julio de 2026. Si entrás tarde, tu puntaje inicial se calcula por mediana de puntos de partidos cerrados. No se incluyen pronósticos especiales en esa mediana.",
  },
  {
    title: "Teams",
    body: "Un Team necesita al menos 7 Jugadores activos para competir en ranking grupal. Puede tener más de 11 jugadores, pero puntúan los mejores 11. El Capitán crea el Team. El DT es quien más puntos tiene.",
  },
  {
    title: "Cambios de Team",
    body: "Un jugador puede cambiar de Team solo si todavía no participó en ningún Team activo. No puede irse de un Team que ya tenga puntos acumulados. El jugador debe aceptar la invitación para ingresar.",
  },
  {
    title: "Bolsa de jugadores libres",
    body: "Los jugadores sin Team pueden quedar disponibles para recibir invitaciones. Igual siguen compitiendo en el ranking individual.",
  },
  {
    title: "Eliminación directa y penales",
    body: "En eliminación directa se pronostica marcador y clasificado. El marcador válido incluye alargue, pero no incluye penales. Si termina 1-1 y Argentina gana por penales, el resultado válido es 1-1 y clasifica Argentina.",
    bullets: [
      "Acierta marcador exacto y clasificado: 5 pts",
      "Acierta clasificado: 3 pts",
      "No acierta clasificado: 0 pts",
    ],
  },
  {
    title: "Desempates",
    body: "En caso de empate se define por:",
    bullets: [
      "Mayor cantidad de pronósticos cargados.",
      "Mayor cantidad de aciertos de resultados.",
      "Fecha de activación del Pase Solidario.",
      "Sorteo.",
    ],
    ordered: true,
  },
  {
    title: "Resultados oficiales",
    body: "SoliProde tomará como válidos los resultados oficiales publicados por FIFA o por la fuente oficial definida por la organización.",
  },
  {
    title: "Pagos y aportes",
    body: "El usuario será Jugador activo únicamente cuando su Aporte esté confirmado. La organización podrá validar manualmente pagos pendientes, no identificados, duplicados o enviados por error.",
  },
  {
    title: "Casos especiales",
    body: "La organización podrá resolver situaciones no previstas, errores técnicos, conflictos de Team, pagos no identificados, partidos suspendidos o cambios oficiales del torneo.",
  },
] as const;

type RulesPageProps = {
  searchParams?: Promise<{
    p?: string;
    promoter?: string;
  }>;
};

export default async function RulesPage({ searchParams }: RulesPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const promoterCode = params ? readPromoterCodeFromSearchParams(new URLSearchParams(params)) : null;
  const sessionState = await getServerSessionState();
  const registerHref = appendPromoterQuery("/register", promoterCode);

  const primaryAction = !sessionState.isAuthenticated
    ? { href: registerHref, label: "Registrarme para jugar" }
    : sessionState.isPaid
      ? { href: "/matches", label: "Ir a mis pronósticos" }
      : { href: "/dashboard#activar-pase", label: "Activar Pase Solidario" };

  return (
    <PageStack>
      <SurfaceCard
        title="Cómo se juega"
        description="Pronosticá partidos, sumá puntos, armá tu Team y ayudá a financiar una tesis universitaria."
        tone="primary"
      >
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-white/12 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
            +18 obligatorio
          </span>
          <span className="rounded-full bg-white/12 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
            Cierra 3 de julio
          </span>
          <span className="rounded-full bg-[#ffe16d] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-ink)]">
            $300.000 inicial
          </span>
        </div>
      </SurfaceCard>

      <section className="grid gap-4">
        <div>
          <h2 className="font-serif text-[2rem] font-bold uppercase leading-none text-[var(--color-ink)]">
            Reglamento corto
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Lo esencial para entrar al torneo, competir con tu Team y entender cómo se reparten los puntos.
          </p>
        </div>
        <div className="grid gap-4">
          {summaryCards.map((card) => (
            <article
              key={card.title}
              className="rounded-[1.25rem] border-[1.5px] border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-[0_10px_24px_rgba(0,50,125,0.05)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-serif text-[1.55rem] font-bold uppercase leading-none text-[var(--color-ink)]">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{card.body}</p>
                  {"extra" in card && card.extra ? (
                    <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{card.extra}</p>
                  ) : null}
                </div>
                <span className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-xl bg-[var(--color-primary)] px-3 text-sm font-bold text-white">
                  {card.badge}
                </span>
              </div>
              {"scores" in card && card.scores ? (
                <div className="mt-4 overflow-hidden rounded-xl border border-[var(--color-line)]">
                  {card.scores.map(([label, value], index) => (
                    <div
                      key={label}
                      className={[
                        "grid grid-cols-[1fr_auto] gap-3 bg-white px-4 py-3 text-sm",
                        index > 0 ? "border-t border-[var(--color-line)]" : "",
                      ].join(" ")}
                    >
                      <span className="text-[var(--color-ink)]">{label}</span>
                      <span className="font-bold text-[var(--color-primary)]">{value}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <SurfaceCard title="Pronósticos especiales" description="Suman puntos extra y pueden mover el ranking general.">
        <div className="grid gap-3">
          {specialPredictions.map((prediction) => (
            <div
              key={prediction.title}
              className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="text-base text-[var(--color-ink)]">{prediction.title}</strong>
                <span className="text-sm font-bold uppercase tracking-[0.06em] text-[var(--color-primary)]">
                  {prediction.points}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{prediction.detail}</p>
            </div>
          ))}
        </div>
      </SurfaceCard>

      <section id="reglas-completas" className="grid gap-4">
        <div>
          <h2 className="font-serif text-[2rem] font-bold uppercase leading-none text-[var(--color-ink)]">
            Reglas completas
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Abrí cada bloque para revisar participación, Teams, pagos, desempates y casos especiales.
          </p>
        </div>
        <div className="grid gap-3">
          {ruleSections.map((section) => (
            <details
              key={section.title}
              className="overflow-hidden rounded-[1.1rem] border-[1.5px] border-[var(--color-line)] bg-[var(--color-surface)]"
            >
              <summary className="cursor-pointer list-none px-4 py-4 font-serif text-[1.3rem] font-bold uppercase leading-none text-[var(--color-ink)]">
                {section.title}
              </summary>
              <div className="border-t border-[var(--color-line)] px-4 py-4">
                <p className="text-sm leading-6 text-[var(--color-muted)]">{section.body}</p>
                {"bullets" in section && section.bullets ? (
                  section.ordered ? (
                    <ol className="mt-3 grid gap-2 pl-5 text-sm leading-6 text-[var(--color-muted)]">
                      {section.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ol>
                  ) : (
                    <ul className="mt-3 grid gap-2 pl-5 text-sm leading-6 text-[var(--color-muted)]">
                      {section.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  )
                ) : null}
              </div>
            </details>
          ))}
        </div>
      </section>

      <SurfaceCard title="Siguiente jugada" description="Según tu estado actual, este es el mejor camino para seguir dentro del torneo.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href={primaryAction.href}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#e7ca55] bg-[#ffe16d] px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-ink)]"
          >
            {primaryAction.label}
          </Link>
          <Link
            href="#reglas-completas"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--color-line)] bg-white px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-primary)]"
          >
            Ver reglamento completo
          </Link>
        </div>
      </SurfaceCard>
    </PageStack>
  );
}
