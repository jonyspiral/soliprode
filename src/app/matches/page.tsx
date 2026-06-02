import { PageHero } from "@/components/page-hero";
import {
  ActionTile,
  MatchPlaceholderCard,
  PageStack,
  StatCard,
} from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";

export default function MatchesPage() {
  return (
    <PageStack>
      <PageHero
        title="Partidos y pronósticos."
        description="Acá vas a seguir el fixture, cargar tus resultados y detectar rápido qué partido vence primero."
        tone="stadium"
      />

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <SurfaceCard tone="primary" title="Próximo partido" description="La carga principal del jugador va a vivir acá.">
          <div className="grid gap-4 text-white">
            <div className="border border-white/20 bg-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
              Fase de grupos · Miércoles 18 Jun · 20:00
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-white/70">Brasil</p>
                <p className="font-serif text-5xl uppercase">0</p>
              </div>
              <span className="font-serif text-3xl uppercase text-[var(--color-gold-soft)]">vs</span>
              <div className="text-right">
                <p className="text-sm uppercase tracking-[0.18em] text-white/70">Argentina</p>
                <p className="font-serif text-5xl uppercase">0</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button className="border border-white/25 bg-white/10 px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white">
                Ajustar local
              </button>
              <button className="border border-[var(--color-gold-soft)] bg-[var(--color-gold)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-ink)]">
                Guardar pronóstico
              </button>
            </div>
          </div>
        </SurfaceCard>

        <div className="grid gap-4">
          <StatCard label="Abiertos" value="3" detail="Partidos listos para pronosticar." />
          <StatCard label="Cargados" value="0" detail="Todavía no registraste pronósticos." />
          <StatCard label="Cierran hoy" value="1" detail="Uno vence antes que el resto." />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <SurfaceCard title="Fixture inmediato" description="Los próximos cruces se leen rápido, incluso en móvil.">
          <div className="grid gap-4">
            <MatchPlaceholderCard
              stage="Fase de grupos"
              teams="España vs Francia"
              kickoff="Jueves 19 Jun · 17:00"
            />
            <MatchPlaceholderCard
              stage="Fase de grupos"
              teams="México vs Alemania"
              kickoff="Viernes 20 Jun · 22:00"
            />
          </div>
        </SurfaceCard>

        <SurfaceCard title="Cómo se sigue" description="La idea es que el jugador siempre sepa qué hacer y cuándo.">
          <div className="grid gap-3">
            <ActionTile
              title="Pronóstico abierto"
              description="Partidos disponibles para cargar o ajustar antes del cierre."
              actionLabel="Listo"
            />
            <ActionTile
              title="Partido cerrado"
              description="Una vez vencido el horario, el partido queda bloqueado y pasa a seguimiento."
              actionLabel="Seguimiento"
            />
            <ActionTile
              title="Resultado final"
              description="Cuando el encuentro termine, vas a ver puntaje y comparación contra tu acierto."
              actionLabel="Puntos"
              tone="gold"
            />
          </div>
        </SurfaceCard>
      </section>
    </PageStack>
  );
}
