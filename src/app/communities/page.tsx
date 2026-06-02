import { PageHero } from "@/components/page-hero";
import { ActionTile, PageStack } from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";

export default function CommunitiesPage() {
  return (
    <PageStack>
      <PageHero
        title="Comunidades."
        description="Oficinas, equipos y comunidades juegan acá con una identidad común y su propia tabla."
        tone="stadium"
      />

      <section className="grid gap-4 md:grid-cols-3">
        <ActionTile
          title="Crear comunidad"
          description="Organizá una oficina, un equipo o una comunidad con nombre propio."
          actionLabel="Crear"
        />
        <ActionTile
          title="Unirte"
          description="Entrá por invitación cuando tu comunidad ya esté armada."
          actionLabel="Unirme"
        />
        <ActionTile
          title="Ver ranking"
          description="Seguí la posición compartida y el empuje colectivo de tu comunidad."
          actionLabel="Ver"
          tone="gold"
        />
      </section>

      <SurfaceCard
        title="Qué suma esta capa"
        description="La comunidad agrega identidad compartida sin sacar foco del jugador."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="border-[1.5px] border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4 text-sm leading-6 text-[var(--color-muted)]">
            Ranking compartido por oficina o comunidad
          </div>
          <div className="border-[1.5px] border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4 text-sm leading-6 text-[var(--color-muted)]">
            Invitaciones y seguimiento dentro del mismo espacio
          </div>
        </div>
      </SurfaceCard>
    </PageStack>
  );
}
