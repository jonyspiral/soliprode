import type { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: string;
  detail?: string;
};

export function StatCard({ label, value, detail }: StatCardProps) {
  return (
    <article className="rounded-[1.25rem] border border-[var(--color-line)] bg-white p-4 shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
        {label}
      </p>
      <p className="mt-3 font-serif text-3xl leading-none text-[var(--color-ink)]">{value}</p>
      {detail ? <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{detail}</p> : null}
    </article>
  );
}

type ActionTileProps = {
  title: string;
  description: string;
  actionLabel: string;
};

export function ActionTile({ title, description, actionLabel }: ActionTileProps) {
  return (
    <article className="rounded-[1.25rem] border border-[var(--color-line)] bg-white p-5 shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
      <h3 className="text-base font-semibold text-[var(--color-ink)]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{description}</p>
      <div className="mt-5 inline-flex rounded-full bg-slate-50 px-4 py-2 text-sm font-semibold text-[var(--color-accent)] ring-1 ring-[var(--color-line)]">
        {actionLabel}
      </div>
    </article>
  );
}

type RankedRowProps = {
  name: string;
  meta: string;
  points: string;
};

export function RankedRow({ name, meta, points }: RankedRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[1rem] border border-[var(--color-line)] bg-slate-50 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[var(--color-ink)]">{name}</p>
        <p className="truncate text-xs text-[var(--color-muted)]">{meta}</p>
      </div>
      <p className="shrink-0 text-sm font-semibold text-[var(--color-accent)]">{points}</p>
    </div>
  );
}

type MatchPlaceholderCardProps = {
  stage: string;
  teams: string;
  kickoff: string;
  predictionLabel?: string;
};

export function MatchPlaceholderCard({
  stage,
  teams,
  kickoff,
  predictionLabel = "Pronóstico pendiente",
}: MatchPlaceholderCardProps) {
  return (
    <article className="rounded-[1.25rem] border border-[var(--color-line)] bg-white p-5 shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
        {stage}
      </p>
      <h3 className="mt-3 text-lg font-semibold text-[var(--color-ink)]">{teams}</h3>
      <p className="mt-1 text-sm text-[var(--color-muted)]">{kickoff}</p>
      <div className="mt-5 grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-[var(--color-line)] px-3 py-3 text-center text-sm font-semibold text-[var(--color-ink)]">
          1
        </div>
        <div className="rounded-2xl border border-[var(--color-line)] px-3 py-3 text-center text-sm font-semibold text-[var(--color-ink)]">
          X
        </div>
        <div className="rounded-2xl border border-[var(--color-line)] px-3 py-3 text-center text-sm font-semibold text-[var(--color-ink)]">
          2
        </div>
      </div>
      <p className="mt-3 text-sm text-[var(--color-muted)]">{predictionLabel}</p>
    </article>
  );
}

type PageStackProps = {
  children: ReactNode;
};

export function PageStack({ children }: PageStackProps) {
  return <div className="flex flex-col gap-5 pb-24 sm:gap-6 sm:pb-0">{children}</div>;
}

type InfoNoticeProps = {
  message: string;
  tone?: "info" | "error";
};

export function InfoNotice({ message, tone = "info" }: InfoNoticeProps) {
  const toneClass =
    tone === "error"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-sky-200 bg-sky-50 text-sky-700";

  return <p className={`rounded-[1.1rem] border px-4 py-3 text-sm leading-6 ${toneClass}`}>{message}</p>;
}

type HighlightMetricProps = {
  value: string;
  label: string;
  detail?: string;
};

export function HighlightMetric({ value, label, detail }: HighlightMetricProps) {
  return (
    <article className="rounded-[1.25rem] border border-white/18 bg-white/8 p-4 text-white backdrop-blur">
      <p className="font-serif text-[1.8rem] leading-none sm:text-[2.2rem]">{value}</p>
      <p className="mt-2 text-sm font-semibold">{label}</p>
      {detail ? <p className="mt-1 text-xs leading-5 text-slate-200">{detail}</p> : null}
    </article>
  );
}

type FlowStepProps = {
  step: string;
  title: string;
  description: string;
};

export function FlowStep({ step, title, description }: FlowStepProps) {
  return (
    <article className="rounded-[1.25rem] border border-[var(--color-line)] bg-white p-5 shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
        {step}
      </p>
      <h3 className="mt-3 text-lg font-semibold text-[var(--color-ink)]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{description}</p>
    </article>
  );
}

type ScopeCardProps = {
  title: string;
  summary: string;
  status: string;
  detail: string;
};

export function ScopeCard({ title, summary, status, detail }: ScopeCardProps) {
  return (
    <article className="rounded-[1.25rem] border border-[var(--color-line)] bg-white p-5 shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[var(--color-ink)]">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{summary}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-[var(--color-muted)]">
          {status}
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-[var(--color-ink)]">{detail}</p>
    </article>
  );
}
