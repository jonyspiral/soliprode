import Link from "next/link";
import { PageStack } from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";

export default function AboutPage() {
  return (
    <PageStack>
      <SurfaceCard
        title="Quiénes somos"
        description="SoliProde combina juego, Team y una iniciativa solidaria real sin perder el foco competitivo."
        tone="primary"
      >
        <p className="text-sm leading-6 text-[#dfe6ff]">
          Detrás de SoliProde hay una causa concreta: ayudar a estudiantes universitarios a financiar su tesis final y
          acercarse al cierre de su carrera.
        </p>
      </SurfaceCard>

      <SurfaceCard title="La idea" description="Primero juego, ranking y competencia. La causa aparece como respaldo real del proyecto.">
        <div className="grid gap-4">
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            SoliProde no busca sonar institucional. Es una experiencia pensada para vivir el Mundial con amigos,
            competir por el premio del torneo, armar tu Team y, además, empujar una iniciativa solidaria concreta.
          </p>
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            Cada Pase Solidario ayuda a sostener esa causa. Por eso la historia existe, pero sin correrse del foco
            principal: jugar, sumar puntos y pelear arriba.
          </p>
        </div>
      </SurfaceCard>

      <SurfaceCard title="Seguír jugando" description="Si ya entendiste la causa, podés volver al juego sin rodeos.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#e7ca55] bg-[#ffe16d] px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-ink)]"
          >
            Volver al Home
          </Link>
          <Link
            href="/reglamento"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--color-line)] bg-white px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-primary)]"
          >
            Ver cómo se juega
          </Link>
        </div>
      </SurfaceCard>
    </PageStack>
  );
}
