import Link from "next/link";

type RulesHomeCardProps = {
  href: string;
  className?: string;
};

export function RulesHomeCard({ href, className = "" }: RulesHomeCardProps) {
  return (
    <Link
      href={href}
      className={[
        "block rounded-[1.25rem] border-[1.5px] border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-[0_10px_24px_rgba(0,50,125,0.05)] transition hover:border-[var(--color-primary)]",
        className,
      ].join(" ")}
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-primary)]">
            Reglas del torneo
          </p>
          <h3 className="mt-3 font-serif text-[1.7rem] font-bold uppercase leading-none text-[var(--color-ink)]">
            Cómo se juega
          </h3>
          <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
            Puntos, Teams, premios y cierres. Todo lo que necesitás saber para jugar.
          </p>
        </div>
        <span className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#e7ca55] bg-[#ffe16d] px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-ink)]">
          Ver cómo funciona
        </span>
      </div>
    </Link>
  );
}
