import Link from "next/link";

export function HomePredictionNotice() {
  return (
    <section className="rounded-[1.25rem] border border-[var(--color-line)] bg-[linear-gradient(135deg,rgba(0,71,171,0.1),rgba(154,225,255,0.18))] p-3 shadow-[0_8px_18px_rgba(0,50,125,0.07)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-primary)]">
            Nuevos pronósticos abiertos
          </p>
          <h2 className="mt-1 font-serif text-[1.2rem] font-bold uppercase leading-tight text-[var(--color-primary)]">
            Cargá los octavos y no te pierdas los especiales
          </h2>
          <p className="mt-1 text-sm leading-5 text-[var(--color-muted)]">
            Cada partido cierra al comenzar. También hay puntos extra por campeón, Argentina y premios FIFA.
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <Link
            href="/matches"
            className="rounded-full bg-[var(--color-primary)] px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-white shadow-[0_8px_16px_rgba(0,71,171,0.18)]"
          >
            Pronosticar
          </Link>
          <Link
            href="/matches?tab=specials"
            className="rounded-full border border-[var(--color-primary)]/25 bg-white/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-primary)]"
          >
            Especiales
          </Link>
        </div>
      </div>
    </section>
  );
}
