import { PageHero } from "@/components/page-hero";
import { ActionTile, PageStack } from "@/components/placeholder-primitives";

const adminCards = [
  "Usuarios",
  "Pagos",
  "Partidos",
  "Resultados",
  "Rankings",
  "Promotores",
];

export default function AdminPage() {
  return (
    <PageStack>
      <PageHero
        title="Panel admin."
        description="Vista base para operación del torneo. Mantiene las secciones principales visibles sin conectar todavía permisos, pagos ni persistencia."
      />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {adminCards.map((card) => (
          <ActionTile
            key={card}
            title={card}
            description={`Módulo placeholder para ${card.toLowerCase()} dentro del panel administrativo.`}
            actionLabel={`Abrir ${card}`}
          />
        ))}
      </section>
    </PageStack>
  );
}
