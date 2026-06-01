import type { ReactNode } from "react";

type SurfaceCardProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  tone?: "default" | "dark" | "accent";
};

const toneClasses = {
  default:
    "border border-[var(--color-line)] bg-white shadow-[0_14px_34px_rgba(15,23,42,0.04)]",
  dark:
    "border border-slate-900 bg-[linear-gradient(135deg,#102038_0%,#17385b_100%)] text-white shadow-[0_24px_60px_rgba(15,23,42,0.16)]",
  accent:
    "border border-teal-100 bg-[linear-gradient(180deg,#f6fffe_0%,#eef9f7_100%)] shadow-[0_14px_34px_rgba(15,118,110,0.06)]",
};

export function SurfaceCard({
  title,
  description,
  children,
  tone = "default",
}: SurfaceCardProps) {
  const mutedTextClass = tone === "dark" ? "text-slate-200" : "text-[var(--color-muted)]";
  const titleClass = tone === "dark" ? "text-white" : "text-[var(--color-ink)]";

  return (
    <section className={`rounded-[1.5rem] p-5 sm:p-6 ${toneClasses[tone]}`}>
      {title ? (
        <div className="mb-4">
          <h2 className={`text-lg font-semibold sm:text-xl ${titleClass}`}>{title}</h2>
          {description ? (
            <p className={`mt-2 text-sm leading-6 ${mutedTextClass}`}>{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
