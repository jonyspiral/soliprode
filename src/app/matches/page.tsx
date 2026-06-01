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
        description="Esta superficie ya separa el próximo bloque de carga, el estado del fixture y el resumen de tus envíos para que el pronóstico se vuelva un hábito simple."
      />
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Abiertos hoy" value="3" detail="Partidos listos para pronosticar." />
        <StatCard label="Cargados" value="0" detail="Pronósticos enviados en esta ronda." />
        <StatCard label="Cierran pronto" value="1" detail="Encuentros que vencen en las próximas horas." />
      </section>
      <SurfaceCard title="Próximos partidos" description="Lista mobile-first de encuentros abiertos.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <MatchPlaceholderCard stage="Fase de grupos" teams="Brasil vs Argentina" kickoff="Miércoles 18 Jun · 20:00" />
          <MatchPlaceholderCard stage="Fase de grupos" teams="España vs Francia" kickoff="Jueves 19 Jun · 17:00" />
          <MatchPlaceholderCard stage="Fase de grupos" teams="México vs Alemania" kickoff="Viernes 20 Jun · 22:00" />
        </div>
      </SurfaceCard>
      <section className="grid gap-4 lg:grid-cols-2">
        <SurfaceCard title="Próximo cierre" description="Espacio reservado para la urgencia principal del usuario.">
          <ActionTile
            title="Brasil vs Argentina"
            description="El sistema va a usar este bloque para empujar el próximo pronóstico pendiente con tiempo restante y acceso directo."
            actionLabel="Pronosticar ahora"
          />
        </SurfaceCard>
        <SurfaceCard title="Cómo se va a leer el fixture" description="La página ya deja espacio para estados claros y secuencia de uso.">
          <div className="grid gap-3">
            <div className="rounded-[1.25rem] border border-[var(--color-line)] bg-slate-50 p-4 text-sm text-[var(--color-muted)]">
              Abierto para pronóstico
            </div>
            <div className="rounded-[1.25rem] border border-[var(--color-line)] bg-slate-50 p-4 text-sm text-[var(--color-muted)]">
              Cerrado por horario
            </div>
            <div className="rounded-[1.25rem] border border-[var(--color-line)] bg-slate-50 p-4 text-sm text-[var(--color-muted)]">
              Resultado final y puntos obtenidos
            </div>
          </div>
        </SurfaceCard>
      </section>
      <SurfaceCard title="Estado de tus cargas" description="Espacio para diferenciar pendientes, cerrados y ya enviados.">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[1.25rem] border border-[var(--color-line)] bg-slate-50 p-4 text-sm text-[var(--color-muted)]">
            Pendientes de hoy
          </div>
          <div className="rounded-[1.25rem] border border-[var(--color-line)] bg-slate-50 p-4 text-sm text-[var(--color-muted)]">
            Predicciones enviadas
          </div>
          <div className="rounded-[1.25rem] border border-[var(--color-line)] bg-slate-50 p-4 text-sm text-[var(--color-muted)]">
            Resultados cerrados
          </div>
        </div>
      </SurfaceCard>
    </PageStack>
  );
}
