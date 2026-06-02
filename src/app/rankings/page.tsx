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
      <section className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-[2.2rem] font-bold tracking-[-0.03em] text-[var(--color-primary)]">
            Global Rankings
          </h1>
          <p className="mt-1 text-base text-[var(--color-muted)]">Season 2024 • Week 12</p>
        </div>
        <div className="flex rounded-lg border-[1.5px] border-[var(--color-line)] bg-[var(--color-surface-muted)] p-1 text-[14px]">
          <button className="rounded bg-white px-3 py-1 font-semibold text-[var(--color-primary)] shadow-sm">Global</button>
          <button className="px-3 py-1 text-[var(--color-muted)]">Friends</button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Tu puesto" value="#12" detail="Referencia principal de tu avance." />
        <StatCard label="Tu grupo" value="#3" detail="Posición actual dentro de tu grupo." />
        <StatCard label="Tu comunidad" value="#5" detail="Comparación dentro de tu oficina o comunidad." />
      </section>

      <section className="mt-2 flex items-end justify-center gap-3">
        <div className="w-24">
          <PodiumCard position="2" name="Sarah" points="4,120 pts" />
        </div>
        <div className="w-28 -mt-6">
          <PodiumCard position="1" name="Alex" points="4,550 pts" emphasis="first" />
        </div>
        <div className="w-24">
          <PodiumCard position="3" name="David" points="3,980 pts" />
        </div>
      </section>

      <SurfaceCard title="Tabla general" description="Tu lectura principal del torneo.">
        <div className="grid gap-3">
          <RankedRow name="Vos" meta="Tu posición actual" points="2,150 pts" highlight />
          {["Emma W.", "Carlos T.", "Mike R.", "Jugador 7"].map((row, index) => (
            <RankedRow
              key={row}
              name={row}
              meta={`Posición ${index + 4}`}
              points={`${3800 - index * 50} pts`}
            />
          ))}
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
