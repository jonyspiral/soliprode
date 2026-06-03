"use client";

import { useState } from "react";
import Link from "next/link";
import { CountryFlag } from "@/components/country-flag";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type MatchTeam = {
  id: string;
  name: string;
  short_name: string;
  fifa_code: string;
  country_code: string;
  flag_emoji: string | null;
};

export type MatchBoardItem = {
  id: string;
  stage: string;
  round_name: string;
  group_code: string | null;
  starts_at: string;
  prediction_closes_at: string;
  status: string;
  venue: string | null;
  city: string | null;
  home_team: MatchTeam;
  away_team: MatchTeam;
};

type PredictionSnapshot = {
  id: string;
  match_id: string;
  predicted_home: number;
  predicted_away: number;
  locked_at: string | null;
  points: number;
};

type PredictionState = PredictionSnapshot & {
  homeValue: string;
  awayValue: string;
};

type FeedbackState = {
  tone: "error" | "success";
  message: string;
};

type PredictionBoardProps = {
  matches: MatchBoardItem[];
  initialPredictions: PredictionSnapshot[];
  currentUserId: string | null;
  isAuthenticated: boolean;
  participationActive: boolean;
};

function formatKickoff(startsAt: string) {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(startsAt));
}

async function withClientTimeout<T>(promise: Promise<T>, timeoutMs = 12000): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race<T>([
      promise,
      new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error("prediction_save_timeout")), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

function formatStatus(match: MatchBoardItem) {
  if (!isMatchOpen(match)) {
    return "Cerrado";
  }

  switch (match.status) {
    case "live":
      return "En vivo";
    case "finished":
      return "Finalizado";
    case "cancelled":
      return "Cancelado";
    case "closed":
      return "Cerrado";
    default:
      return "Abierto";
  }
}

function buildState(predictions: PredictionSnapshot[]) {
  return predictions.reduce<Record<string, PredictionState>>((acc, prediction) => {
    acc[prediction.match_id] = {
      ...prediction,
      homeValue: String(prediction.predicted_home),
      awayValue: String(prediction.predicted_away),
    };
    return acc;
  }, {});
}

function isMatchOpen(match: MatchBoardItem) {
  return match.status === "scheduled" && new Date(match.prediction_closes_at).getTime() > Date.now();
}

function parseScore(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return 0;
  }

  if (!/^\d+$/.test(trimmed)) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);

  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function isClosedError(error: { message?: string; code?: string } | null) {
  if (!error) {
    return false;
  }

  const message = `${error.message ?? ""} ${error.code ?? ""}`.toLowerCase();

  return (
    message.includes("row-level security") ||
    message.includes("prediction_closes_at") ||
    message.includes("scheduled") ||
    message.includes("violates")
  );
}

function isTimeoutError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    String((error as { message?: string }).message).toLowerCase().includes("timeout")
  );
}

export function PredictionBoard({
  matches,
  initialPredictions,
  currentUserId,
  isAuthenticated,
  participationActive,
}: PredictionBoardProps) {
  const [predictionState, setPredictionState] = useState<Record<string, PredictionState>>(
    buildState(initialPredictions),
  );
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, FeedbackState>>({});

  function setValue(matchId: string, side: "home" | "away", nextValue: string) {
    setPredictionState((current) => {
      const previous = current[matchId];

      return {
        ...current,
        [matchId]: {
          id: previous?.id ?? "",
          match_id: matchId,
          predicted_home: previous?.predicted_home ?? 0,
          predicted_away: previous?.predicted_away ?? 0,
          locked_at: previous?.locked_at ?? null,
          points: previous?.points ?? 0,
          homeValue: side === "home" ? nextValue : previous?.homeValue ?? "0",
          awayValue: side === "away" ? nextValue : previous?.awayValue ?? "0",
        },
      };
    });
  }

  async function savePrediction(match: MatchBoardItem) {
    if (!isAuthenticated || !currentUserId) {
      setFeedback((current) => ({
        ...current,
        [match.id]: {
          tone: "error",
          message: "Entrá con tu cuenta para guardar pronósticos.",
        },
      }));
      return;
    }

    if (!isMatchOpen(match)) {
      setFeedback((current) => ({
        ...current,
        [match.id]: {
          tone: "error",
          message: "Este partido ya cerró.",
        },
      }));
      return;
    }

    const state = predictionState[match.id] ?? {
      id: "",
      match_id: match.id,
      predicted_home: 0,
      predicted_away: 0,
      locked_at: null,
      points: 0,
      homeValue: "0",
      awayValue: "0",
    };

    const homeScore = parseScore(state.homeValue);
    const awayScore = parseScore(state.awayValue);

    if (homeScore === null || awayScore === null) {
      setFeedback((current) => ({
        ...current,
        [match.id]: {
          tone: "error",
          message: "Ingresá goles válidos con números enteros desde 0.",
        },
      }));
      return;
    }

    setSavingMatchId(match.id);
    setFeedback((current) => {
      const next = { ...current };
      delete next[match.id];
      return next;
    });

    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await withClientTimeout(
        supabase
          .from("predictions")
          .upsert(
            {
              profile_id: currentUserId,
              user_id: currentUserId,
              match_id: match.id,
              predicted_home: homeScore,
              predicted_away: awayScore,
              predicted_home_score: homeScore,
              predicted_away_score: awayScore,
            },
            { onConflict: "profile_id,match_id" },
          )
          .select("id, match_id, predicted_home, predicted_away, locked_at, points")
          .single(),
      );

      if (error || !data) {
        throw error ?? new Error("No pudimos guardar el pronóstico.");
      }

      setPredictionState((current) => ({
        ...current,
        [match.id]: {
          ...data,
          homeValue: String(data.predicted_home),
          awayValue: String(data.predicted_away),
        },
      }));
      setFeedback((current) => ({
        ...current,
        [match.id]: {
          tone: "success",
          message: participationActive
            ? "Pronóstico guardado. Ya compite en el ranking."
            : "Pronóstico guardado. Completá tu inscripción para jugar.",
        },
      }));
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[matches] savePrediction failed", {
          matchId: match.id,
          currentUserId,
          error,
        });
      }

      const supabaseError =
        typeof error === "object" && error !== null && "message" in error ? (error as { message?: string; code?: string }) : null;

      setFeedback((current) => ({
        ...current,
        [match.id]: {
          tone: "error",
          message: isClosedError(supabaseError)
            ? "Este partido ya cerró."
            : isTimeoutError(error)
              ? "No pudimos guardar el pronóstico. Probá de nuevo."
            : "No pudimos guardar este pronóstico. Intentá de nuevo.",
        },
      }));
    } finally {
      setSavingMatchId(null);
    }
  }

  return (
    <div className="grid gap-3">
      {!isAuthenticated ? (
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-sm leading-6 text-[var(--color-muted)]">
          Mirá el fixture ahora. Para guardar pronósticos,{" "}
          <Link href="/login" className="font-semibold text-[var(--color-primary)]">
            entrá al Prode
          </Link>
          .
        </div>
      ) : null}

      {matches.map((match) => {
        const state = predictionState[match.id];
        const homeValue = state?.homeValue ?? "0";
        const awayValue = state?.awayValue ?? "0";
        const note = feedback[match.id];
        const open = isMatchOpen(match);

        return (
          <article
            key={match.id}
            className="overflow-hidden rounded-[1.1rem] border-[1.5px] border-[var(--color-line)] bg-[var(--color-surface)] shadow-[0_8px_18px_rgba(0,50,125,0.05)]"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[var(--color-line)] bg-[var(--color-surface-muted)] px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-primary)]">
                  {match.group_code ? `Grupo ${match.group_code} · ` : ""}
                  {match.round_name}
                </p>
                <p className="mt-1 text-[13px] font-semibold text-[var(--color-ink)]">
                  {formatKickoff(match.starts_at)}
                </p>
                <p className="mt-0.5 text-[11px] leading-5 text-[var(--color-muted)]">
                  {match.venue && match.city ? `${match.venue} • ${match.city}` : match.venue ?? match.city ?? "Sede por confirmar"}
                </p>
              </div>
              <span
                className={[
                  "rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]",
                  open
                    ? "bg-[rgba(154,225,255,0.22)] text-[var(--color-secondary)]"
                    : "bg-[var(--color-surface)] text-[var(--color-muted)]",
                ].join(" ")}
              >
                {formatStatus(match)}
              </span>
            </div>

            <div className="grid gap-3 p-3">
              {[
                {
                  key: `${match.id}-home`,
                  team: match.home_team,
                  side: "home" as const,
                  value: homeValue,
                },
                {
                  key: `${match.id}-away`,
                  team: match.away_team,
                  side: "away" as const,
                  value: awayValue,
                },
              ].map(({ key, team, side, value }) => (
                <div key={key} className="grid grid-cols-[minmax(0,1fr)_4.5rem] items-center gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <CountryFlag
                      country={team.name}
                      label={team.name}
                      size="sm"
                      emoji={team.flag_emoji}
                      countryCode={team.country_code}
                      className="shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-baseline gap-2">
                        <p className="shrink-0 font-serif text-[1.1rem] font-bold uppercase leading-none text-[var(--color-primary)]">
                          {team.fifa_code}
                        </p>
                        <p className="truncate text-[14px] font-semibold text-[var(--color-ink)]">
                          {team.short_name}
                        </p>
                      </div>
                      <p className="truncate text-[11px] leading-5 text-[var(--color-muted)]">{team.name}</p>
                    </div>
                  </div>

                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    disabled={!open || savingMatchId === match.id}
                    value={value}
                    onChange={(event) => setValue(match.id, side, event.target.value)}
                    className="min-h-10 w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-2 text-center font-serif text-[1.35rem] font-bold text-[var(--color-primary)] outline-none disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label={`Goles ${team.name}`}
                  />
                </div>
              ))}

              {note ? (
                <p
                  className={[
                    "rounded-lg border px-3 py-2 text-sm leading-6",
                    note.tone === "error"
                      ? "border-[var(--color-error)]/25 bg-[#ffdad6] text-[#93000a]"
                      : "border-[var(--color-secondary)]/25 bg-[rgba(154,225,255,0.25)] text-[var(--color-secondary)]",
                  ].join(" ")}
                >
                  {note.message}
                </p>
              ) : null}

              <button
                type="button"
                onClick={() => void savePrediction(match)}
                disabled={!isAuthenticated || !open || savingMatchId === match.id}
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#e7ca55] bg-[#ffe16d] px-4 py-2.5 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingMatchId === match.id ? "Guardando..." : open ? "Guardar pronóstico" : "Este partido ya cerró"}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
