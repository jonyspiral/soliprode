import { PageHero } from "@/components/page-hero";
import { ActionTile, PageStack } from "@/components/placeholder-primitives";
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
      <SurfaceCard title="Vista futura del grupo" description="Placeholder para ranking interno y actividad del grupo.">
        <div className="rounded-[1.5rem] border border-dashed border-[var(--color-line)] bg-slate-50 p-5 text-sm leading-6 text-[var(--color-muted)]">
          Esta superficie va a alojar standings internos, comparación entre miembros y CTA de invitación.
        </div>
      </SurfaceCard>
    </PageStack>
  );
}
