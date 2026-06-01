import type { ReactNode } from "react";

type SurfaceCardProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  tone?: "default" | "dark" | "accent";
};

const toneClasses = {
  default:
    "border border-[var(--color-line)] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.04)]",
  dark:
    "border border-slate-800 bg-[linear-gradient(135deg,#0f172a_0%,#1e3a5f_100%)] text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]",
  accent:
    "border border-teal-200 bg-[linear-gradient(180deg,#f3fffd_0%,#e7f8f6_100%)] shadow-[0_18px_40px_rgba(15,118,110,0.08)]",
};

export function SurfaceCard({
  title,
  description,
  children,
  tone = "default",
}: SurfaceCardProps) {
  const mutedTextClass = tone === "dark" ? "text-slate-200" : "text-[var(--color-muted)]";

  return (
    <section className={`rounded-[1.75rem] p-5 sm:p-6 ${toneClasses[tone]}`}>
      {title ? (
        <div className="mb-4">
          <h2 className="text-lg font-semibold sm:text-xl">{title}</h2>
          {description ? (
            <p className={`mt-2 text-sm leading-6 ${mutedTextClass}`}>{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
