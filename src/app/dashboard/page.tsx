import { PageHero } from "@/components/page-hero";
import { PageStack, StatCard } from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";

export default function DashboardPage() {
  return (
    <PageStack>
      <PageHero
        title="Tu panel de juego."
        description="Resumen placeholder de rendimiento, posiciones y próximo partido a pronosticar. No hay datos reales todavía, pero la estructura ya refleja la prioridad del producto."
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Puntos totales" value="128" detail="Base visual para puntaje acumulado." />
        <StatCard label="Ranking general" value="#42" detail="Posición frente a todos los jugadores." />
        <StatCard label="Ranking de grupo" value="#5" detail="Comparativa dentro de tu grupo principal." />
        <StatCard label="Ranking comunidad" value="#2" detail="Lugar dentro de tu oficina o comunidad." />
        <StatCard label="Próximo partido" value="BRA vs ARG" detail="Siguiente evento pendiente de predicción." />
      </section>
      <SurfaceCard
        title="Próxima predicción"
        description="Espacio reservado para llevar al usuario directo al próximo partido abierto."
      >
        <div className="rounded-[1.5rem] border border-dashed border-[var(--color-line)] bg-slate-50 p-5">
          <p className="text-sm font-semibold text-[var(--color-ink)]">Brasil vs Argentina</p>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Placeholder para resumen, deadline de carga y CTA para pronosticar en un toque.
          </p>
        </div>
      </SurfaceCard>
    </PageStack>
  );
}
