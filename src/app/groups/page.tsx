import { PageHero } from "@/components/page-hero";
import { ActionTile, PageStack } from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";

export default function GroupsPage() {
  return (
    <PageStack>
      <PageHero
        title="Tus grupos."
        description="Acá vas a poder crear un grupo, unirte a uno existente y compartir la invitación cuando esa parte del juego ya esté activa."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <ActionTile
          title="Crear grupo"
          description="Para jugar con amigos, compañeros o un equipo más chico."
          actionLabel="Crear"
        />
        <ActionTile
          title="Unirte a un grupo"
          description="Con un código o invitación cuando ese flujo esté habilitado."
          actionLabel="Unirme"
        />
        <ActionTile
          title="Invitar"
          description="Más adelante vas a compartir un link simple desde este mismo espacio."
          actionLabel="Compartir"
        />
      </section>

      <SurfaceCard
        title="Qué vas a encontrar acá"
        description="La idea es que el grupo sea una capa simple para competir de forma más cercana."
      >
        <div className="rounded-[1.25rem] border border-[var(--color-line)] bg-slate-50 p-5 text-sm leading-6 text-[var(--color-muted)]">
          Cuando el flujo esté completo, esta pantalla va a concentrar ranking interno, miembros e
          invitaciones sin mezclarlo con el resto del torneo.
        </div>
      </SurfaceCard>
    </PageStack>
  );
}
