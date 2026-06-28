"use client";

import { useState } from "react";
import Link from "next/link";
import { savePredictionAction } from "@/app/matches/actions";
import { CountryFlag } from "@/components/country-flag";
import { formatZoneLabel } from "@/lib/fixture/zone-labels";

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
  home_slot_rule: string | null;
  away_slot_rule: string | null;
  home_slot_label: string | null;
  away_slot_label: string | null;
  bracket_position: string | null;
  bracket_side: string | null;
  home_team: MatchTeam | null;
  away_team: MatchTeam | null;
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

function formatStatus(match: MatchBoardItem) {
  if (!isMatchReady(match)) {
    return "Por definir";
  }

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
  return (
    isMatchReady(match) &&
    match.status === "scheduled" &&
    new Date(match.prediction_closes_at).getTime() > Date.now()
  );
}

function isMatchReady(match: MatchBoardItem) {
  return Boolean(match.home_team && match.away_team);
}

function getDisplayTeam(match: MatchBoardItem, side: "home" | "away") {
  const team = side === "home" ? match.home_team : match.away_team;
  const slotLabel = side === "home" ? match.home_slot_label : match.away_slot_label;

  return {
    team,
    slotLabel,
    displayCode: team?.fifa_code ?? "TBD",
    displayName: team?.short_name ?? slotLabel ?? "Equipo por definir",
    subtitle: team?.name ?? "Se define al cierre de la fase de zonas.",
  };
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
  const [justSavedMatchId, setJustSavedMatchId] = useState<string | null>(null);

  function setValue(matchId: string, side: "home" | "away", nextValue: string) {
    setPredictionState((current) => {
      const previous = current[matchId];
      const normalizedValue = /^\d+$/.test(nextValue.trim()) ? String(Math.max(0, Number.parseInt(nextValue, 10))) : nextValue;

      return {
        ...current,
        [matchId]: {
          id: previous?.id ?? "",
          match_id: matchId,
          predicted_home: previous?.predicted_home ?? 0,
          predicted_away: previous?.predicted_away ?? 0,
          locked_at: previous?.locked_at ?? null,
          points: previous?.points ?? 0,
          homeValue: side === "home" ? normalizedValue : previous?.homeValue ?? "0",
          awayValue: side === "away" ? normalizedValue : previous?.awayValue ?? "0",
        },
      };
    });
  }

  function adjustValue(matchId: string, side: "home" | "away", delta: number) {
    const previous = predictionState[matchId];
    const currentValue = side === "home" ? previous?.homeValue ?? "0" : previous?.awayValue ?? "0";
    const parsedValue = parseScore(currentValue) ?? 0;
    const nextValue = String(Math.max(0, parsedValue + delta));
    setValue(matchId, side, nextValue);
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
          message: isMatchReady(match)
            ? "Este partido ya cerró."
            : "Vas a poder pronosticar cuando se definan los equipos.",
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
    setJustSavedMatchId(null);
    setFeedback((current) => {
      const next = { ...current };
      delete next[match.id];
      return next;
    });

    try {
      const result = await savePredictionAction({
        matchId: match.id,
        homeScore,
        awayScore,
      });

      if (!result.ok) {
        setFeedback((current) => ({
          ...current,
          [match.id]: {
            tone: "error",
            message: result.message,
          },
        }));
        return;
      }

      const data = result.prediction;

      setPredictionState((current) => ({
        ...current,
        [match.id]: {
          ...data,
          homeValue: String(data.predicted_home),
          awayValue: String(data.predicted_away),
        },
      }));
      setJustSavedMatchId(match.id);
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
        console.error("[matches] savePrediction action call failed", {
          matchId: match.id,
          currentUserId,
          profileId: currentUserId,
          error,
        });
      }

      setFeedback((current) => ({
        ...current,
        [match.id]: {
          tone: "error",
          message: "No pudimos guardar el pronóstico. Probá de nuevo.",
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
      {isAuthenticated && !participationActive ? (
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-sm leading-6 text-[var(--color-muted)]">
          Tus picks se pueden mirar, pero para competir necesitás activar tu Pase Solidario.{" "}
          <Link href="/activar-pase" className="font-semibold text-[var(--color-primary)]">
            Activar mi Pase
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
        const ready = isMatchReady(match);
        const homeSavedValue = state?.predicted_home ?? 0;
        const awaySavedValue = state?.predicted_away ?? 0;
        const isDirty = homeValue !== String(homeSavedValue) || awayValue !== String(awaySavedValue);
        const buttonLabel =
          savingMatchId === match.id
            ? "Guardando..."
            : !ready
              ? "Esperando clasificados"
              : !open
              ? "Este partido ya cerró"
              : isDirty || !state?.id
                ? "Guardar"
                : justSavedMatchId === match.id
                  ? "Guardado ✓"
                  : "Guardado";

        return (
          <article
            key={match.id}
            className="overflow-hidden rounded-[1.1rem] border-[1.5px] border-[var(--color-line)] bg-[var(--color-surface)] shadow-[0_8px_18px_rgba(0,50,125,0.05)]"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[var(--color-line)] bg-[var(--color-surface-muted)] px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-primary)]">
                  {match.group_code ? `${formatZoneLabel(match.group_code)} · ` : ""}
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

            <div className="grid gap-2.5 p-3">
              {[
                {
                  key: `${match.id}-home`,
                  side: "home" as const,
                  value: homeValue,
                },
                {
                  key: `${match.id}-away`,
                  side: "away" as const,
                  value: awayValue,
                },
              ].map(({ key, side, value }) => {
                const { team, displayCode, displayName, slotLabel, subtitle } = getDisplayTeam(match, side);

                return (
                <div key={key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {team ? (
                      <CountryFlag
                        country={team.name}
                        label={team.name}
                        size="sm"
                        emoji={team.flag_emoji}
                        countryCode={team.country_code}
                        className="shrink-0"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border-[1.5px] border-dashed border-[var(--color-line)] bg-[var(--color-surface-muted)] text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                        TBD
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-baseline gap-2">
                        <p className="shrink-0 font-serif text-[1.1rem] font-bold uppercase leading-none text-[var(--color-primary)]">
                          {displayCode}
                        </p>
                        <p className="truncate text-[14px] font-semibold text-[var(--color-ink)]">
                          {displayName}
                        </p>
                      </div>
                      <p className="truncate text-[11px] leading-5 text-[var(--color-muted)]">
                        {slotLabel && !team ? subtitle : team?.name ?? subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => adjustValue(match.id, side, -1)}
                      disabled={!open || savingMatchId === match.id}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] text-base font-bold text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label={`Restar gol ${displayName}`}
                    >
                      -
                    </button>
                    <span
                      className="flex h-9 min-w-[2.6rem] items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-2 text-center font-serif text-[1.2rem] font-bold text-[var(--color-primary)]"
                      aria-label={`Goles ${displayName}`}
                    >
                      {value}
                    </span>
                    <button
                      type="button"
                      onClick={() => adjustValue(match.id, side, 1)}
                      disabled={!open || savingMatchId === match.id}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] text-base font-bold text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label={`Sumar gol ${displayName}`}
                    >
                      +
                    </button>
                  </div>
                </div>
              )})}

              {!ready ? (
                <p className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm leading-6 text-[var(--color-muted)]">
                  Vas a poder pronosticar cuando se definan los equipos.
                </p>
              ) : null}

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

              {!participationActive && isAuthenticated ? (
                <Link
                  href="/activar-pase"
                  className="inline-flex min-h-9 items-center justify-center self-start rounded-lg border border-[#e7ca55] bg-[#ffe16d] px-3 py-2 text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink)]"
                >
                  Activar mi Pase
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => void savePrediction(match)}
                  disabled={!isAuthenticated || !open || savingMatchId === match.id}
                  className="inline-flex min-h-9 items-center justify-center self-start rounded-lg border border-[#e7ca55] bg-[#ffe16d] px-3 py-2 text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {buttonLabel}
                </button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
