import { PageHero } from "@/components/page-hero";
import { ActionTile, PageStack } from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";

export default function GroupsPage() {
  return (
    <PageStack>
      <PageHero
        title="Grupos."
        description="Este espacio concentra la competencia corta: amigos, equipo o mesa de oficina."
        tone="stadium"
      />

      <section className="grid gap-4 md:grid-cols-3">
        <ActionTile
          title="Crear grupo"
          description="Armá una liga chica para competir más cerca con amigos o compañeros."
          actionLabel="Crear"
        />
        <ActionTile
          title="Unirte a un grupo"
          description="Entrá con un código o invitación sin salir del panel principal."
          actionLabel="Unirme"
        />
        <ActionTile
          title="Invitar"
          description="Compartí un link corto para sumar jugadores al mismo grupo."
          actionLabel="Compartir"
          tone="gold"
        />
      </section>

      <SurfaceCard
        title="Qué vas a seguir acá"
        description="El grupo existe para simplificar una competencia chica, no para complicar el torneo principal."
      >
        <div className="grid gap-3 md:grid-cols-3">
          <div className="border-[1.5px] border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4 text-sm leading-6 text-[var(--color-muted)]">
            Ranking interno del grupo
          </div>
          <div className="border-[1.5px] border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4 text-sm leading-6 text-[var(--color-muted)]">
            Miembros e invitaciones
          </div>
          <div className="border-[1.5px] border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4 text-sm leading-6 text-[var(--color-muted)]">
            Comparación rápida contra el resto
          </div>
        </div>
      </SurfaceCard>
    </PageStack>
  );
}
