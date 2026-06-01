import { PageHero } from "@/components/page-hero";
import { PageStack, RankedRow } from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";

const rankingSections = [
  { title: "Ranking general", rows: ["Jugador 1", "Jugador 2", "Jugador 3"] },
  { title: "Ranking de grupo", rows: ["Grupo A · Ana", "Grupo A · Juan", "Grupo A · Sol"] },
  { title: "Ranking de comunidad", rows: ["Oficina Norte · Eva", "Oficina Norte · Leo", "Oficina Norte · Dani"] },
  { title: "Comparación de grupos", rows: ["Marketing", "Ventas", "Producto"] },
  { title: "Comparación de comunidades", rows: ["Oficina Norte", "Comunidad Alumni", "Equipo Tesis"] },
];

export default function RankingsPage() {
  return (
    <PageStack>
      <PageHero
        title="Rankings y comparativas."
        description="La superficie ya separa los distintos niveles de competencia para que la lógica posterior no termine colapsando todo en una sola tabla."
      />
      <section className="grid gap-4 lg:grid-cols-2">
        {rankingSections.map((section) => (
          <SurfaceCard key={section.title} title={section.title}>
            <div className="flex flex-col gap-3">
              {section.rows.map((row, index) => (
                <RankedRow
                  key={row}
                  name={row}
                  meta={`Posición ${index + 1}`}
                  points={`${126 - index * 4} pts`}
                />
              ))}
            </div>
          </SurfaceCard>
        ))}
      </section>
    </PageStack>
  );
}
