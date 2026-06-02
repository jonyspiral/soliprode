import type { ReactNode } from "react";
import { TrophyIcon } from "@/components/app-icons";

type StatCardProps = {
  label: string;
  value: string;
  detail?: string;
};

export function StatCard({ label, value, detail }: StatCardProps) {
  return (
    <article className="rounded-xl border-[1.5px] border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-[0_8px_18px_rgba(0,50,125,0.06)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
        {label}
      </p>
      <p className="mt-3 font-serif text-[2rem] font-bold leading-none text-[var(--color-primary)]">
        {value}
      </p>
      {detail ? <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{detail}</p> : null}
    </article>
  );
}

type ActionTileProps = {
  title: string;
  description: string;
  actionLabel: string;
  tone?: "default" | "gold";
};

export function ActionTile({
  title,
  description,
  actionLabel,
  tone = "default",
}: ActionTileProps) {
  const buttonClass =
    tone === "gold"
      ? "bg-[var(--color-gold)] text-[var(--color-ink)]"
      : "bg-[var(--color-primary)] text-white";

  return (
    <article className="rounded-xl border-[1.5px] border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-[0_8px_18px_rgba(0,50,125,0.06)]">
      <h3 className="font-serif text-[1.5rem] font-bold uppercase leading-none text-[var(--color-ink)]">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{description}</p>
      <div
        className={`mt-5 inline-flex rounded-lg px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] shadow-sm ${buttonClass}`}
      >
        {actionLabel}
      </div>
    </article>
  );
}

type RankedRowProps = {
  name: string;
  meta: string;
  points: string;
  highlight?: boolean;
};

export function RankedRow({ name, meta, points, highlight = false }: RankedRowProps) {
  return (
    <div
      className={[
        "flex items-center justify-between gap-3 border-b border-[var(--color-line)] px-4 py-4 last:border-b-0",
        highlight ? "bg-[rgba(154,225,255,0.2)]" : "bg-[var(--color-surface)]",
      ].join(" ")}
    >
      <div className="min-w-0">
        <p className="truncate text-base font-semibold text-[var(--color-ink)]">{name}</p>
        <p className="truncate text-sm text-[var(--color-muted)]">{meta}</p>
      </div>
      <p className="shrink-0 font-serif text-[1.5rem] font-bold text-[var(--color-primary)]">{points}</p>
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
  const [home, away] = teams.split(" vs ");

  return (
    <article className="overflow-hidden rounded-xl border-[1.5px] border-[var(--color-primary)] bg-[var(--color-surface)] shadow-[0_10px_22px_rgba(0,50,125,0.08)]">
      <div className="flex items-center justify-between bg-[var(--color-primary)] px-4 py-2 text-white">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em]">{stage}</p>
        <p className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em]">
          {kickoff}
        </p>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 p-4">
        <div className="text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-lg border-2 border-[var(--color-line)] bg-[var(--color-surface-muted)] font-serif text-lg font-bold text-[var(--color-primary)]">
            {home?.slice(0, 3).toUpperCase()}
          </div>
          <p className="font-serif text-[1.8rem] font-bold uppercase leading-none">{home}</p>
        </div>
        <div className="rounded-lg border-[1.5px] border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3 font-serif text-[1.8rem] font-bold text-[var(--color-muted)]">
          VS
        </div>
        <div className="text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-lg border-2 border-[var(--color-line)] bg-[var(--color-surface-muted)] font-serif text-lg font-bold text-[var(--color-primary)]">
            {away?.slice(0, 3).toUpperCase()}
          </div>
          <p className="font-serif text-[1.8rem] font-bold uppercase leading-none">{away}</p>
        </div>
      </div>
      <div className="border-t border-[var(--color-line)] px-4 py-3 text-sm text-[var(--color-muted)]">
        {predictionLabel}
      </div>
    </article>
  );
}

type PageStackProps = {
  children: ReactNode;
};

export function PageStack({ children }: PageStackProps) {
  return <div className="flex flex-col gap-5 pb-24 md:gap-6 md:pb-8">{children}</div>;
}

type InfoNoticeProps = {
  message: string;
  tone?: "info" | "error";
};

export function InfoNotice({ message, tone = "info" }: InfoNoticeProps) {
  const toneClass =
    tone === "error"
      ? "border-[var(--color-error)]/25 bg-[#ffdad6] text-[#93000a]"
      : "border-[var(--color-secondary)]/25 bg-[rgba(154,225,255,0.25)] text-[var(--color-secondary)]";

  return <p className={`rounded-lg border px-4 py-3 text-sm leading-6 ${toneClass}`}>{message}</p>;
}

type HighlightMetricProps = {
  value: string;
  label: string;
  detail?: string;
};

export function HighlightMetric({ value, label, detail }: HighlightMetricProps) {
  return (
    <article className="rounded-xl border-[1.5px] border-white/15 bg-white/10 p-4 text-white backdrop-blur">
      <p className="font-serif text-[2rem] font-bold leading-none sm:text-[2.4rem]">{value}</p>
      <p className="mt-2 text-sm font-semibold uppercase tracking-[0.08em]">{label}</p>
      {detail ? <p className="mt-1 text-xs leading-5 text-[#dfe6ff]">{detail}</p> : null}
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
    <article className="rounded-xl border-[1.5px] border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-[0_8px_18px_rgba(0,50,125,0.06)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-primary)]">
        {step}
      </p>
      <h3 className="mt-3 font-serif text-[1.6rem] font-bold uppercase leading-none text-[var(--color-ink)]">
        {title}
      </h3>
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
    <article className="rounded-xl border-[1.5px] border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-[0_8px_18px_rgba(0,50,125,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-[1.55rem] font-bold uppercase leading-none text-[var(--color-ink)]">
            {title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{summary}</p>
        </div>
        <span className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
          {status}
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-[var(--color-ink)]">{detail}</p>
    </article>
  );
}

type PodiumCardProps = {
  position: string;
  name: string;
  points: string;
  emphasis?: "first" | "default";
};

export function PodiumCard({ position, name, points, emphasis = "default" }: PodiumCardProps) {
  const highlight = emphasis === "first";

  return (
    <article
      className={[
        "flex flex-col items-center rounded-xl border-[1.5px] p-4 text-center shadow-[0_8px_18px_rgba(0,50,125,0.06)]",
        highlight
          ? "border-[var(--color-gold)] bg-[rgba(255,225,109,0.22)]"
          : "border-[var(--color-line)] bg-[var(--color-surface)]",
      ].join(" ")}
    >
      <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[var(--color-line)] bg-[linear-gradient(135deg,#0047ab_0%,#0c6780_100%)] text-white shadow-sm">
        <TrophyIcon className="h-7 w-7" />
      </div>
      <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-primary)] ring-1 ring-[var(--color-line)]">
        #{position}
      </span>
      <p className="mt-3 font-serif text-[1.8rem] font-bold uppercase leading-none text-[var(--color-primary)]">
        {name}
      </p>
      <p className="mt-2 text-lg font-bold text-[var(--color-gold)]">{points}</p>
    </article>
  );
}
