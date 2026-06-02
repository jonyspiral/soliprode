import { PageHero } from "@/components/page-hero";
import { ActionTile, PageStack } from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";

const adminCards = ["Usuarios", "Pagos", "Partidos", "Resultados", "Rankings", "Promotores"];

export default function AdminPage() {
  return (
    <PageStack>
      <PageHero
        title="Admin."
        description="Superficie operativa secundaria para ordenar el torneo sin mezclarla con la experiencia del jugador."
        tone="stadium"
      />

      <SurfaceCard
        title="Operación del torneo"
        description="La administración sigue visible, pero se mantiene separada del flujo principal del jugador."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {adminCards.map((card) => (
            <ActionTile
              key={card}
              title={card}
              description={`Entrada prevista para gestionar ${card.toLowerCase()} sin contaminar el panel principal.`}
              actionLabel={`Abrir ${card}`}
            />
          ))}
        </div>
      </SurfaceCard>
    </PageStack>
  );
}
