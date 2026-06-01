import { PageHero } from "@/components/page-hero";
import {
  MatchPlaceholderCard,
  PageStack,
} from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";

export default function MatchesPage() {
  return (
    <PageStack>
      <PageHero
        title="Partidos y pronósticos."
        description="Vista base para próximos encuentros y carga rápida de predicciones. Todo sigue siendo placeholder visual, pero ya muestra la anatomía principal del flujo."
      />
      <SurfaceCard title="Próximos partidos" description="Lista mobile-first de encuentros abiertos.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <MatchPlaceholderCard stage="Fase de grupos" teams="Brasil vs Argentina" kickoff="Miércoles 18 Jun · 20:00" />
          <MatchPlaceholderCard stage="Fase de grupos" teams="España vs Francia" kickoff="Jueves 19 Jun · 17:00" />
          <MatchPlaceholderCard stage="Fase de grupos" teams="México vs Alemania" kickoff="Viernes 20 Jun · 22:00" />
        </div>
      </SurfaceCard>
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
