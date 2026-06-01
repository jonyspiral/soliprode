import { PageHero } from "@/components/page-hero";
import { ActionTile, PageStack } from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";

const adminCards = ["Usuarios", "Pagos", "Partidos", "Resultados", "Rankings", "Promotores"];

export default function AdminPage() {
  return (
    <PageStack>
      <PageHero
        title="Admin."
        description="Este panel queda visible como superficie operativa secundaria para la administración del torneo."
      />

      <SurfaceCard
        title="Operación del torneo"
        description="La administración se organiza por módulos para no mezclar usuarios, partidos, resultados y rankings en una sola pantalla."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {adminCards.map((card) => (
            <ActionTile
              key={card}
              title={card}
              description={`Entrada prevista para gestionar ${card.toLowerCase()}.`}
              actionLabel={`Abrir ${card}`}
            />
          ))}
        </div>
      </SurfaceCard>
    </PageStack>
  );
}
