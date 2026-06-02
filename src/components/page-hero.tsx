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
      ? "border-[1.5px] border-[var(--color-primary)] bg-[linear-gradient(180deg,#00419e_0%,#00327d_100%)] text-white shadow-[0_18px_40px_rgba(0,50,125,0.26)]"
      : "border-[1.5px] border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink)] shadow-[0_8px_20px_rgba(0,50,125,0.06)]";

  const eyebrowClass = tone === "stadium" ? "text-[var(--color-gold-soft)]" : "text-[var(--color-primary)]";
  const descriptionClass = tone === "stadium" ? "text-[#dfe6ff]" : "text-[var(--color-muted)]";

  return (
    <section className={`overflow-hidden rounded-xl px-5 py-6 sm:px-7 sm:py-8 ${classes}`}>
      {eyebrow ? (
        <p className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${eyebrowClass}`}>
          {eyebrow}
        </p>
      ) : null}
      <div className="mt-2 flex flex-col gap-4">
        <div className="max-w-3xl">
          <h1 className="font-serif text-[2.6rem] font-bold uppercase leading-[0.95] tracking-[-0.03em] sm:text-[4rem]">
            {title}
          </h1>
          <p className={`mt-3 max-w-2xl text-base leading-7 ${descriptionClass}`}>{description}</p>
        </div>
        {children}
      </div>
    </section>
  );
}
