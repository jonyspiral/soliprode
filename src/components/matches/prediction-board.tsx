"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CountryFlag } from "@/components/country-flag";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type MatchTeam = {
  id: string;
  name: string;
  code: string;
  flag_url: string | null;
};

export type MatchBoardItem = {
  id: string;
  phase: string;
  group_name: string | null;
  starts_at: string;
  status: string;
  score_home: number | null;
  score_away: number | null;
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
  homeValue: number;
  awayValue: number;
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
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(startsAt));
}

function buildState(predictions: PredictionSnapshot[]) {
  return predictions.reduce<Record<string, PredictionState>>((acc, prediction) => {
    acc[prediction.match_id] = {
      ...prediction,
      homeValue: prediction.predicted_home,
      awayValue: prediction.predicted_away,
    };
    return acc;
  }, {});
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

  const savedCount = useMemo(
    () => Object.keys(predictionState).length,
    [predictionState],
  );

  function setValue(matchId: string, side: "home" | "away", nextValue: number) {
    setPredictionState((current) => {
      const previous = current[matchId];

      return {
        ...current,
        [matchId]: {
          id: previous?.id ?? "",
          match_id: matchId,
          predicted_home: previous?.predicted_home ?? Math.max(0, side === "home" ? nextValue : 0),
          predicted_away: previous?.predicted_away ?? Math.max(0, side === "away" ? nextValue : 0),
          locked_at: previous?.locked_at ?? null,
          points: previous?.points ?? 0,
          homeValue:
            side === "home" ? Math.max(0, nextValue) : previous?.homeValue ?? 0,
          awayValue:
            side === "away" ? Math.max(0, nextValue) : previous?.awayValue ?? 0,
        },
      };
    });
  }

  async function savePrediction(matchId: string) {
    if (!isAuthenticated || !currentUserId) {
      setFeedback((current) => ({
        ...current,
        [matchId]: {
          tone: "error",
          message: "Entrá con tu cuenta para guardar pronósticos.",
        },
      }));
      return;
    }

    const state = predictionState[matchId] ?? {
      id: "",
      match_id: matchId,
      predicted_home: 0,
      predicted_away: 0,
      locked_at: null,
      points: 0,
      homeValue: 0,
      awayValue: 0,
    };

    setSavingMatchId(matchId);
    setFeedback((current) => {
      const next = { ...current };
      delete next[matchId];
      return next;
    });

    try {
      const supabase = createBrowserSupabaseClient();
      const payload = {
        predicted_home: state.homeValue,
        predicted_away: state.awayValue,
      };

      const query = state.id
        ? supabase
            .from("predictions")
            .update(payload)
            .eq("id", state.id)
            .select("id, match_id, predicted_home, predicted_away, locked_at, points")
            .single()
        : supabase
            .from("predictions")
            .insert({
              profile_id: currentUserId,
              match_id: matchId,
              ...payload,
            })
            .select("id, match_id, predicted_home, predicted_away, locked_at, points")
            .single();

      const { data, error } = await query;

      if (error || !data) {
        throw error ?? new Error("No pudimos guardar el pronóstico.");
      }

      setPredictionState((current) => ({
        ...current,
        [matchId]: {
          ...data,
          homeValue: data.predicted_home,
          awayValue: data.predicted_away,
        },
      }));
      setFeedback((current) => ({
        ...current,
        [matchId]: {
          tone: "success",
          message: participationActive
            ? "Pronóstico guardado. Va a competir si el partido no empezó."
            : "Pronóstico guardado como borrador. Activá tu participación para competir por premios.",
        },
      }));
    } catch {
      setFeedback((current) => ({
        ...current,
        [matchId]: {
          tone: "error",
          message: "No pudimos guardar este pronóstico. Intentá de nuevo.",
        },
      }));
    } finally {
      setSavingMatchId(null);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3 rounded-lg border-[1.5px] border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
            Pronósticos guardados
          </p>
          <p className="mt-1 font-serif text-[1.9rem] font-bold text-[var(--color-primary)]">
            {savedCount}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
            Estado
          </p>
          <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">
            {participationActive ? "Activos para competir" : "Borrador hasta activar"}
          </p>
        </div>
      </div>

      {!isAuthenticated ? (
        <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-4 text-sm leading-6 text-[var(--color-muted)]">
          Podés mirar el fixture ahora mismo. Para guardar pronósticos,{" "}
          <Link href="/login" className="font-semibold text-[var(--color-primary)]">
            ingresá con tu cuenta
          </Link>
          {" "}o{" "}
          <Link href="/register" className="font-semibold text-[var(--color-primary)]">
            creá una gratis
          </Link>
          .
        </div>
      ) : null}

      {matches.map((match) => {
        const state = predictionState[match.id];
        const homeValue = state?.homeValue ?? 0;
        const awayValue = state?.awayValue ?? 0;
        const note = feedback[match.id];
        const kickoff = formatKickoff(match.starts_at);

        return (
          <article
            key={match.id}
            className="overflow-hidden rounded-lg border-[1.5px] border-[var(--color-primary)] bg-[var(--color-surface)]"
          >
            <div className="flex items-center justify-between bg-[var(--color-primary)] px-4 py-2 text-white">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em]">
                  {match.phase}
                  {match.group_name ? ` • Grupo ${match.group_name}` : ""}
                </p>
                <p className="mt-1 text-xs text-[#dfe6ff]">{kickoff}</p>
              </div>
              <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em]">
                {participationActive ? "Compite" : "Draft"}
              </span>
            </div>

            <div className="grid gap-4 p-4">
              {[
                {
                  team: match.home_team,
                  side: "home" as const,
                  value: homeValue,
                },
                {
                  team: match.away_team,
                  side: "away" as const,
                  value: awayValue,
                },
              ].map(({ team, side, value }, index) => (
                <div
                  key={`${match.id}-${team.id}`}
                  className={index === 0 ? "flex items-center justify-between border-b border-[var(--color-line)] pb-4" : "flex items-center justify-between"}
                >
                  <div className="flex items-center gap-3">
                    <CountryFlag country={team.name} label={team.name} size="md" />
                    <div>
                      <p className="font-serif text-[1.5rem] font-bold uppercase leading-none text-[var(--color-ink)]">
                        {team.code}
                      </p>
                      <p className="mt-1 text-sm text-[var(--color-muted)]">{team.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setValue(match.id, side, value - 1)}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface-muted)] text-[var(--color-ink)]"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-serif text-[2.2rem] font-bold text-[var(--color-primary)]">
                      {value}
                    </span>
                    <button
                      type="button"
                      onClick={() => setValue(match.id, side, value + 1)}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)] text-white"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}

              {note ? (
                <p
                  className={[
                    "rounded-lg border px-4 py-3 text-sm leading-6",
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
                onClick={() => void savePrediction(match.id)}
                disabled={savingMatchId === match.id}
                className="flex items-center justify-center gap-2 rounded-lg border border-[#e7ca55] bg-[#ffe16d] px-4 py-3 font-serif text-[1.2rem] uppercase text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {savingMatchId === match.id
                  ? "Guardando..."
                  : participationActive
                    ? "Guardar pronóstico"
                    : "Guardar borrador"}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
