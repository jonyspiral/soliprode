import { PageHero } from "@/components/page-hero";
import { PageStack, PodiumCard, RankedRow, StatCard } from "@/components/placeholder-primitives";
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
        title="Rankings."
        description="Ubicate rápido en la tabla general y después bajá al detalle de tu grupo o tu comunidad."
        tone="stadium"
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Tu puesto" value="#12" detail="Referencia principal de tu avance." />
        <StatCard label="Tu grupo" value="#3" detail="Posición actual dentro de tu grupo." />
        <StatCard label="Tu comunidad" value="#5" detail="Comparación dentro de tu oficina o comunidad." />
      </section>

      <SurfaceCard title="Tabla general" description="La lectura principal del torneo arranca por acá.">
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <PodiumCard position="1" name="Jugador 1" points="126 pts" emphasis="first" />
            <PodiumCard position="2" name="Jugador 2" points="122 pts" />
            <PodiumCard position="3" name="Jugador 3" points="119 pts" />
          </div>
          <div className="grid gap-3">
            <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
              <span>Tabla activa</span>
              <span>General</span>
            </div>
            <RankedRow name="Vos" meta="Tu posición actual" points="98 pts" highlight />
            {["Jugador 4", "Jugador 5", "Jugador 6", "Jugador 7"].map((row, index) => (
              <RankedRow
                key={row}
                name={row}
                meta={`Posición ${index + 4}`}
                points={`${116 - index * 3} pts`}
              />
            ))}
          </div>
        </div>
      </SurfaceCard>

      <section className="grid gap-4 lg:grid-cols-2">
        {rankingSections.slice(1).map((section) => (
          <SurfaceCard key={section.title} title={section.title}>
            <div className="flex flex-col gap-3">
              {section.rows.map((row, index) => (
                <RankedRow
                  key={row}
                  name={row}
                  meta={`Posición ${index + 1}`}
                  points={`${126 - index * 4} pts`}
                  highlight={section.title === "Tu grupo" && index === 1}
                />
              ))}
            </div>
          </SurfaceCard>
        ))}
      </section>
    </PageStack>
  );
}
