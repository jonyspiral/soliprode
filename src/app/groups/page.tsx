import { PageHero } from "@/components/page-hero";
import { ActionTile, PageStack, ScopeCard } from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";

export default function GroupsPage() {
  return (
    <PageStack>
      <PageHero
        title="Grupos del torneo."
        description="Espacio base para crear grupos, sumarse a uno existente y compartir invitaciones sin mezclar todavía reglas reales ni persistencia."
      />
      <section className="grid gap-4 md:grid-cols-3">
        <ActionTile
          title="Crear grupo"
          description="Placeholder para iniciar un grupo propio de amigos, oficina o comunidad."
          actionLabel="Crear"
        />
        <ActionTile
          title="Unirse a un grupo"
          description="Carril reservado para código, enlace o invitación directa."
          actionLabel="Unirse"
        />
        <ActionTile
          title="Link de invitación"
          description="Módulo visual para compartir un enlace único cuando exista backend real."
          actionLabel="Copiar link"
        />
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <ScopeCard
          title="Competencia cerrada"
          summary="Cada grupo va a tener ranking, actividad y acceso rápido a invitaciones."
          status="Diseñado"
          detail="La página ya separa alta, ingreso y distribución de invitaciones como carriles distintos."
        />
        <ScopeCard
          title="Uso esperado"
          summary="Oficinas, amigos o comunidades chicas con ganas de competir entre sí."
          status="Listo para crecer"
          detail="El siguiente salto funcional es conectar código de invitación, owner y ranking interno real."
        />
      </section>
      <SurfaceCard title="Vista futura del grupo" description="Placeholder para ranking interno y actividad del grupo.">
        <div className="rounded-[1.5rem] border border-dashed border-[var(--color-line)] bg-slate-50 p-5 text-sm leading-6 text-[var(--color-muted)]">
          Esta superficie va a alojar standings internos, comparación entre miembros y CTA de invitación.
        </div>
      </SurfaceCard>
    </PageStack>
  );
}
