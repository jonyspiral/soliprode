import { PageHero } from "@/components/page-hero";
import { PageStack, RankedRow, ScopeCard, StatCard } from "@/components/placeholder-primitives";
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
        description="La tabla de posiciones ya está pensada como sistema: ranking general, ranking social y comparación entre estructuras sin mezclar contextos."
      />
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="General" value="1 tabla" detail="La referencia principal del torneo." />
        <StatCard label="Social" value="2 capas" detail="Grupo y comunidad con su lectura propia." />
        <StatCard label="Comparativas" value="2 vistas" detail="Cruce entre grupos y comunidades." />
      </section>
      <section className="grid gap-4 xl:grid-cols-3">
        <ScopeCard
          title="Ranking general"
          summary="La tabla que ordena todo el torneo con el mismo criterio de puntos."
          status="Base lista"
          detail="Es la vista más estable del sistema y funciona como referencia global del juego."
        />
        <ScopeCard
          title="Ranking de grupo"
          summary="Un lente más íntimo para competir con gente cercana."
          status="Preparado"
          detail="Va a usar la misma base de puntos con una capa social más compacta."
        />
        <ScopeCard
          title="Ranking de comunidad"
          summary="La capa ideal para oficinas, equipos y colectivos organizados."
          status="Preparado"
          detail="Permite sostener identidad compartida sin perder comparabilidad contra el torneo completo."
        />
      </section>
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
