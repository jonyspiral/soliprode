import { PageHero } from "@/components/page-hero";
import { ActionTile, PageStack } from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";

export default function CommunitiesPage() {
  return (
    <PageStack>
      <PageHero
        title="Comunidades y oficinas."
        description="Base para organizar oficinas, comunidades o equipos con ranking propio y visibilidad solidaria, sin implementar todavía reglas ni estructura de datos."
      />
      <section className="grid gap-4 md:grid-cols-3">
        <ActionTile
          title="Crear comunidad"
          description="Placeholder para alta de una oficina, equipo o comunidad organizadora."
          actionLabel="Crear"
        />
        <ActionTile
          title="Unirse a comunidad"
          description="Carril de invitación o búsqueda de una comunidad existente."
          actionLabel="Unirse"
        />
        <ActionTile
          title="Ranking de comunidad"
          description="Entrada visual al ranking compartido y comparación entre miembros."
          actionLabel="Ver ranking"
        />
      </section>
      <SurfaceCard title="Estructura prevista" description="Placeholder de operación y visibilidad por comunidad.">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[1.25rem] border border-[var(--color-line)] bg-slate-50 p-4 text-sm text-[var(--color-muted)]">
            Panel interno de comunidad
          </div>
          <div className="rounded-[1.25rem] border border-[var(--color-line)] bg-slate-50 p-4 text-sm text-[var(--color-muted)]">
            Objetivo solidario compartido
          </div>
        </div>
      </SurfaceCard>
    </PageStack>
  );
}
