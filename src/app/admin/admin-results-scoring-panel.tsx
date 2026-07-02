"use client";

import { useMemo, useState } from "react";
import { AdminRebuildRankingsButton } from "@/app/admin/admin-rebuild-rankings-button";

export type MatchAdminRow = {
  id: string;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamCode: string;
  awayTeamCode: string;
  startsAt: string;
  status: string;
  stage: string | null;
  roundName: string | null;
  groupCode: string | null;
  scoreHome: number | null;
  scoreAway: number | null;
  hasResult: boolean;
  searchIndex: string;
};

export type MatchSummaryCounts = {
  total: number;
  withResult: number;
  withoutResult: number;
  finished: number;
  scheduled: number;
  byStage: Record<string, number>;
  byStatus: Record<string, number>;
};

type ActionHandler = (formData: FormData) => void | Promise<void>;

type MatchFilter = "all" | "without-result" | "with-result" | "finished" | "scheduled";

type AdminResultsScoringPanelProps = {
  matches: MatchAdminRow[];
  publishMatchResultAction: ActionHandler;
  summaryCounts: MatchSummaryCounts;
};

const FILTERS: Array<{ key: MatchFilter; label: string }> = [
  { key: "all", label: "Todos" },
  { key: "without-result", label: "Sin resultado" },
  { key: "with-result", label: "Con resultado" },
  { key: "finished", label: "Finalizados" },
  { key: "scheduled", label: "Programados" },
];

function formatMatchDateTime(startsAt: string) {
  const date = new Date(startsAt);

  if (!Number.isFinite(date.getTime())) {
    return startsAt;
  }

  const weekday = new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(date);
  const day = new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(date);
  const time = new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(date);

  const safeWeekday = weekday ? weekday.charAt(0).toUpperCase() + weekday.slice(1).replace(".", "") : "";
  return `${safeWeekday} ${day} · ${time}`;
}

function formatMatchMeta(match: MatchAdminRow) {
  const parts: string[] = [];

  if (match.roundName?.trim()) {
    parts.push(match.roundName.trim());
  } else if (match.stage?.trim()) {
    parts.push(match.stage.trim());
  }

  if (match.groupCode?.trim()) {
    parts.push(`Zona ${match.groupCode.trim()}`);
  }

  parts.push(formatMatchDateTime(match.startsAt));

  return parts.join(" · ");
}

function formatMatchStatus(status: string | null | undefined) {
  if (!status) {
    return "pending";
  }

  return status.replaceAll("_", " ");
}

function matchesFilter(match: MatchAdminRow, activeFilter: MatchFilter) {
  if (activeFilter === "without-result") {
    return !match.hasResult;
  }

  if (activeFilter === "with-result") {
    return match.hasResult;
  }

  if (activeFilter === "finished") {
    return match.status === "finished";
  }

  if (activeFilter === "scheduled") {
    return match.status === "scheduled";
  }

  return true;
}

export function AdminResultsScoringPanel({
  matches,
  publishMatchResultAction,
  summaryCounts,
}: AdminResultsScoringPanelProps) {
  const [activeFilter, setActiveFilter] = useState<MatchFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const statusSummary = Object.entries(summaryCounts.byStatus)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([status, count]) => `${formatMatchStatus(status)} ${count}`)
    .join(" · ");
  const stageSummary = Object.entries(summaryCounts.byStage)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([stage, count]) => `${stage.replaceAll("_", " ")} ${count}`)
    .join(" · ");
  const visibleMatches = useMemo(
    () =>
      matches.filter((match) => {
        if (!matchesFilter(match, activeFilter)) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        return match.searchIndex.includes(normalizedSearch);
      }),
    [activeFilter, matches, normalizedSearch],
  );

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4">
        <p className="max-w-3xl text-sm leading-6 text-[var(--color-muted)]">
          Si ya hay resultados oficiales cargados, podés re-scorear los partidos finalizados y reconstruir el ranking general sin tocar KO, especiales ni mediana.
        </p>
        <AdminRebuildRankingsButton />
      </div>

      <div className="grid gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4">
        <p className="text-sm font-semibold text-[var(--color-ink)]">
          {`Total ${summaryCounts.total} · Con resultado ${summaryCounts.withResult} · Sin resultado ${summaryCounts.withoutResult} · Finalizados ${summaryCounts.finished} · Programados ${summaryCounts.scheduled}`}
        </p>
        {statusSummary ? (
          <p className="text-xs leading-5 text-[var(--color-muted)]">Status: {statusSummary}</p>
        ) : null}
        {stageSummary ? (
          <p className="text-xs leading-5 text-[var(--color-muted)]">Stage: {stageSummary}</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => {
            const active = activeFilter === filter.key;

            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => setActiveFilter(filter.key)}
                className={[
                  "inline-flex min-h-9 items-center justify-center rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em]",
                  active
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                    : "border-[var(--color-line)] bg-white text-[var(--color-muted)]",
                ].join(" ")}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
        <label className="grid gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
            Buscar equipo
          </span>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por equipo, código o zona"
            className="min-h-11 rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
          />
        </label>
      </div>

      {matches.length === 0 ? (
        <p className="text-sm leading-6 text-[var(--color-muted)]">
          Todavía no hay partidos cargados para operar.
        </p>
      ) : (
        <div className="max-h-[920px] overflow-y-auto rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-3">
          <div className="grid gap-3">
            {visibleMatches.length > 0 ? (
              visibleMatches.map((match) => (
                <div
                  key={match.id}
                  className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="grid gap-1">
                      <p className="font-serif text-[1.2rem] font-bold uppercase leading-tight text-[var(--color-primary)]">
                        {match.homeTeamName} vs {match.awayTeamName}
                      </p>
                      <p className="text-sm text-[var(--color-muted)]">{formatMatchMeta(match)}</p>
                      <p className="text-sm text-[var(--color-muted)]">
                        Estado actual: {formatMatchStatus(match.status)}
                        {match.hasResult ? ` · ${match.scoreHome} - ${match.scoreAway}` : " · Sin resultado"}
                      </p>
                    </div>

                    <form action={publishMatchResultAction} className="grid gap-3 lg:min-w-[280px]">
                      <input type="hidden" name="match_id" value={match.id} />
                      <div className="grid grid-cols-2 gap-3">
                        <label className="grid gap-1">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                            {match.homeTeamCode}
                          </span>
                          <input
                            name="score_home"
                            type="number"
                            min="0"
                            defaultValue={match.scoreHome ?? 0}
                            className="min-h-11 rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
                          />
                        </label>
                        <label className="grid gap-1">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                            {match.awayTeamCode}
                          </span>
                          <input
                            name="score_away"
                            type="number"
                            min="0"
                            defaultValue={match.scoreAway ?? 0}
                            className="min-h-11 rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
                          />
                        </label>
                      </div>
                      <button
                        type="submit"
                        className="inline-flex w-full items-center justify-center rounded-lg border border-[#e7ca55] bg-[#ffe16d] px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-ink)]"
                      >
                        Publicar resultado y recalcular
                      </button>
                    </form>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4 text-sm text-[var(--color-muted)]">
                No hay partidos que coincidan con el filtro actual.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
