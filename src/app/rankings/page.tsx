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
      <section className="rounded-2xl bg-[linear-gradient(180deg,#0047ab_0%,#00327d_100%)] p-4 text-white shadow-[0_18px_42px_rgba(0,50,125,0.22)]">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-[2.2rem] font-bold uppercase tracking-[-0.03em]">
              Rankings
            </h1>
            <p className="mt-1 text-sm leading-6 text-[#dfe6ff]">Tabla general • Semana 12</p>
          </div>
          <div className="flex rounded-lg border border-white/20 bg-white/10 p-1 text-[14px]">
            <button className="rounded bg-white px-3 py-1 font-semibold text-[var(--color-primary)] shadow-sm">General</button>
            <button className="px-3 py-1 text-[#dfe6ff]">Grupo</button>
          </div>
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

      <SurfaceCard title="Tabla general" description="La lectura principal del torneo vive acá.">
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

      <section className="grid gap-4">
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
