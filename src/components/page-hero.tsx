import type { ReactNode } from "react";

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
};

export function PageHero({ eyebrow, title, description, children }: PageHeroProps) {
  return (
    <section className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-6 shadow-[0_14px_36px_rgba(15,23,42,0.05)] sm:px-8 sm:py-8">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
          {eyebrow}
        </p>
      ) : null}
      <div className="mt-3 flex flex-col gap-4">
        <div className="max-w-3xl">
          <h1 className="font-serif text-[2.25rem] leading-[1.05] text-[var(--color-ink)] sm:text-[3.5rem]">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[var(--color-muted)] sm:text-lg">
            {description}
          </p>
        </div>
        {children}
      </div>
    </section>
  );
}
