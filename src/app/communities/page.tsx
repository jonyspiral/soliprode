import { PageHero } from "@/components/page-hero";
import { ActionTile, PageStack } from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";

export default function CommunitiesPage() {
  return (
    <PageStack>
      <PageHero
        title="Comunidades."
        description="Este espacio va a reunir oficinas, equipos o comunidades que quieran jugar con una identidad compartida dentro del torneo."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <ActionTile
          title="Crear comunidad"
          description="Para organizar una oficina, un equipo o una comunidad propia."
          actionLabel="Crear"
        />
        <ActionTile
          title="Unirte"
          description="Con invitación o búsqueda cuando esa opción ya esté disponible."
          actionLabel="Unirme"
        />
        <ActionTile
          title="Ver ranking"
          description="Acá vas a seguir la posición compartida de tu comunidad."
          actionLabel="Ver"
        />
      </section>

      <SurfaceCard
        title="Qué va a sumar esta capa"
        description="La comunidad extiende el juego sin complicar la experiencia principal del jugador."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[1rem] border border-[var(--color-line)] bg-slate-50 p-4 text-sm leading-6 text-[var(--color-muted)]">
            Ranking compartido por oficina o comunidad
          </div>
          <div className="rounded-[1rem] border border-[var(--color-line)] bg-slate-50 p-4 text-sm leading-6 text-[var(--color-muted)]">
            Invitaciones y seguimiento dentro del mismo espacio
          </div>
        </div>
      </SurfaceCard>
    </PageStack>
  );
}
