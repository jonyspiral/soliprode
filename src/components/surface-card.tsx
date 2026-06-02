import type { ReactNode } from "react";

type SurfaceCardProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  tone?: "default" | "primary" | "accent";
};

const toneClasses = {
  default:
    "border-[1.5px] border-[var(--color-line)] bg-[var(--color-surface)] shadow-sm",
  primary:
    "border-[1.5px] border-[var(--color-primary)] bg-[linear-gradient(180deg,#0047ab_0%,#00327d_100%)] text-white shadow-[0_10px_24px_rgba(0,50,125,0.22)]",
  accent:
    "border-[1.5px] border-[var(--color-gold)] bg-[rgba(255,225,109,0.22)] shadow-sm",
};

export function SurfaceCard({
  title,
  description,
  children,
  tone = "default",
}: SurfaceCardProps) {
  const titleClass = tone === "primary" ? "text-white" : "text-[var(--color-ink)]";
  const descriptionClass = tone === "primary" ? "text-[#dfe6ff]" : "text-[var(--color-muted)]";

  return (
    <section className={`rounded-xl p-4 ${toneClasses[tone]}`}>
      {title ? (
        <div className="mb-4">
          <h2 className={`font-serif text-[1.6rem] font-bold uppercase leading-none ${titleClass}`}>
            {title}
          </h2>
          {description ? (
            <p className={`mt-2 text-sm leading-6 ${descriptionClass}`}>{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
