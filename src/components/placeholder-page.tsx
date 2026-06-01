import { PageHero } from "@/components/page-hero";

type PlaceholderPageProps = {
  title: string;
  description: string;
  highlights: string[];
};

export function PlaceholderPage({
  title,
  description,
  highlights,
}: PlaceholderPageProps) {
  return (
    <div className="flex flex-col gap-6 pb-24 sm:pb-0">
      <PageHero
        eyebrow="Base inicial"
        title={title}
        description={description}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {highlights.map((item) => (
          <article
            key={item}
            className="rounded-[1.75rem] border border-[var(--color-line)] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.04)]"
          >
            <h2 className="text-lg font-semibold text-[var(--color-ink)]">
              Próximo paso
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              {item}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
