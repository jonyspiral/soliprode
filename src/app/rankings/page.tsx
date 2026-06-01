import { PageHero } from "@/components/page-hero";
import { PageStack, RankedRow, StatCard } from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";

const rankingSections = [
  { title: "Tabla general", rows: ["Jugador 1", "Jugador 2", "Jugador 3"] },
  { title: "Tu grupo", rows: ["Ana", "Juan", "Sol"] },
  { title: "Tu comunidad", rows: ["Eva", "Leo", "Dani"] },
  { title: "Comparación de grupos", rows: ["Marketing", "Ventas", "Producto"] },
];

export default function RankingsPage() {
  return (
    <PageStack>
      <PageHero
        title="Tus rankings."
        description="Esta pantalla está pensada para que puedas ubicarte rápido en la tabla general y después mirar tu grupo o tu comunidad."
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="General" value="1 tabla" detail="La referencia principal del torneo." />
        <StatCard label="Social" value="2 capas" detail="Grupo y comunidad con lectura propia." />
        <StatCard label="Comparativas" value="1 vista" detail="Cruce entre grupos cuando esté activo." />
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
