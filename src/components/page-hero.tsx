import type { ReactNode } from "react";

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
  tone?: "default" | "stadium";
};

export function PageHero({
  eyebrow,
  title,
  description,
  children,
  tone = "default",
}: PageHeroProps) {
  const classes =
    tone === "stadium"
      ? "border-[1.5px] border-[var(--color-primary)] bg-[linear-gradient(180deg,#0047ab_0%,#00327d_100%)] text-white shadow-[0_10px_24px_rgba(0,50,125,0.22)]"
      : "border-[1.5px] border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink)] shadow-sm";

  const eyebrowClass = tone === "stadium" ? "text-[var(--color-gold-soft)]" : "text-[var(--color-primary)]";
  const descriptionClass = tone === "stadium" ? "text-[#dfe6ff]" : "text-[var(--color-muted)]";

  return (
    <section className={`overflow-hidden rounded-xl px-4 py-5 ${classes}`}>
      {eyebrow ? (
        <p className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${eyebrowClass}`}>
          {eyebrow}
        </p>
      ) : null}
      <div className="mt-2 flex flex-col gap-4">
        <div className="max-w-3xl">
          <h1 className="font-serif text-[2.25rem] font-bold uppercase leading-[0.95] tracking-[-0.03em] sm:text-[2.5rem]">
            {title}
          </h1>
          <p className={`mt-2 max-w-2xl text-base leading-6 ${descriptionClass}`}>{description}</p>
        </div>
        {children}
      </div>
    </section>
  );
}
