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
        title="Tus partidos."
        description="Acá vas a ver el fixture abierto, cargar tus pronósticos y detectar rápido qué encuentros cierran primero."
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Abiertos" value="3" detail="Partidos listos para pronosticar." />
        <StatCard label="Cargados" value="0" detail="Todavía no registraste pronósticos." />
        <StatCard label="Cierran hoy" value="1" detail="Uno de los partidos vence primero." />
      </section>

      <SurfaceCard
        title="Próximos partidos"
        description="La pantalla está preparada para que el fixture se lea rápido desde el teléfono."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <MatchPlaceholderCard
            stage="Fase de grupos"
            teams="Brasil vs Argentina"
            kickoff="Miércoles 18 Jun · 20:00"
          />
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

      <section className="grid gap-4 lg:grid-cols-2">
        <SurfaceCard
          title="Próximo paso"
          description="Cuando el fixture ya esté cargado en producción, este bloque va a empujar la acción más urgente."
        >
          <ActionTile
            title="Brasil vs Argentina"
            description="Ese partido va a aparecer primero cuando sea el próximo en vencer."
            actionLabel="Pronosticar"
          />
        </SurfaceCard>

        <SurfaceCard
          title="Cómo se va a leer"
          description="La idea es que cada partido muestre un estado claro sin sobrecargar la vista."
        >
          <div className="grid gap-3">
            <div className="rounded-[1rem] border border-[var(--color-line)] bg-slate-50 p-4 text-sm text-[var(--color-muted)]">
              Abierto para pronosticar
            </div>
            <div className="rounded-[1rem] border border-[var(--color-line)] bg-slate-50 p-4 text-sm text-[var(--color-muted)]">
              Cerrado por horario
            </div>
            <div className="rounded-[1rem] border border-[var(--color-line)] bg-slate-50 p-4 text-sm text-[var(--color-muted)]">
              Resultado final y puntos obtenidos
            </div>
          </div>
        </SurfaceCard>
      </section>
    </PageStack>
  );
}
