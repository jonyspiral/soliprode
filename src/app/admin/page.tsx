import { PageHero } from "@/components/page-hero";
import { ActionTile, PageStack, ScopeCard } from "@/components/placeholder-primitives";

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
        description="Vista base para la operación del torneo. El objetivo es que el backoffice crezca por módulos claros en vez de volverse una pantalla única y opaca."
      />
      <section className="grid gap-4 lg:grid-cols-2">
        <ScopeCard
          title="Operación del torneo"
          summary="Usuarios, promotores, partidos, resultados y rankings viven como módulos separados."
          status="Arquitectura visible"
          detail="Eso permite sumar permisos y herramientas reales sin colapsar la administración en una sola tabla gigante."
        />
        <ScopeCard
          title="Próximo salto"
          summary="El panel admin queda listo para integrar resultados, recálculo de rankings y monitoreo de inscripciones."
          status="Pendiente de lógica"
          detail="Cuando entre backend real, esta superficie ya tiene la taxonomía del sistema resuelta."
        />
      </section>
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
