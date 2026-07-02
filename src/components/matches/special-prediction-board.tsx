"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { saveSpecialPredictionAction } from "@/app/matches/actions";
import type { SpecialPredictionPick, SpecialPredictionQuestion } from "@/lib/special-predictions/contracts";

type SpecialPredictionBoardProps = {
  questions: SpecialPredictionQuestion[];
  initialPredictions: SpecialPredictionPick[];
  isAuthenticated: boolean;
  participationActive: boolean;
};

type QuestionSelectionState = {
  predictionId: string | null;
  selectedOptionId: string | null;
  savedOptionId: string | null;
  points: number;
  lockedAt: string | null;
};

type QuestionFeedback = {
  tone: "error" | "success";
  message: string;
};

function buildState(predictions: SpecialPredictionPick[]) {
  return predictions.reduce<Record<string, QuestionSelectionState>>((acc, prediction) => {
    acc[prediction.question_id] = {
      predictionId: prediction.id,
      selectedOptionId: prediction.option_id,
      savedOptionId: prediction.option_id,
      points: prediction.points,
      lockedAt: prediction.locked_at,
    };
    return acc;
  }, {});
}

function formatCloseDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatCountdown(closesAt: string, nowMs: number) {
  const diffMs = new Date(closesAt).getTime() - nowMs;

  if (!Number.isFinite(diffMs) || diffMs <= 0) {
    return "Cerrado";
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) {
    return `Cierra en ${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `Cierra en ${hours}h ${minutes}m`;
  }

  return `Cierra en ${Math.max(1, minutes)}m`;
}

function getQuestionState(question: SpecialPredictionQuestion, nowMs: number) {
  const closesAtMs = new Date(question.closes_at).getTime();

  if (question.status === "resolved") {
    return "resolved" as const;
  }

  if (!Number.isFinite(closesAtMs) || closesAtMs <= nowMs || question.status === "closed") {
    return "closed" as const;
  }

  return "open" as const;
}

function getStatusLabel(question: SpecialPredictionQuestion, nowMs: number) {
  const state = getQuestionState(question, nowMs);

  switch (state) {
    case "resolved":
      return "Resuelto";
    case "closed":
      return "Cerrado";
    default:
      return "Abierto";
  }
}

export function SpecialPredictionBoard({
  questions,
  initialPredictions,
  isAuthenticated,
  participationActive,
}: SpecialPredictionBoardProps) {
  const [selectionState, setSelectionState] = useState<Record<string, QuestionSelectionState>>(
    buildState(initialPredictions),
  );
  const [feedback, setFeedback] = useState<Record<string, QuestionFeedback>>({});
  const [savingQuestionId, setSavingQuestionId] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const highlightedPointBuckets = useMemo(
    () => [
      { label: "Campeón", points: 20 },
      { label: "Subcampeón", points: 10 },
      { label: "Premios FIFA", points: 7 },
    ],
    [],
  );

  function selectOption(questionId: string, optionId: string) {
    setSelectionState((current) => {
      const previous = current[questionId];

      return {
        ...current,
        [questionId]: {
          predictionId: previous?.predictionId ?? null,
          selectedOptionId: optionId,
          savedOptionId: previous?.savedOptionId ?? null,
          points: previous?.points ?? 0,
          lockedAt: previous?.lockedAt ?? null,
        },
      };
    });
  }

  function saveQuestion(question: SpecialPredictionQuestion) {
    if (!isAuthenticated) {
      setFeedback((current) => ({
        ...current,
        [question.id]: {
          tone: "error",
          message: "Entrá con tu cuenta para guardar pronósticos especiales.",
        },
      }));
      return;
    }

    const questionState = getQuestionState(question, nowMs);

    if (questionState !== "open") {
      setFeedback((current) => ({
        ...current,
        [question.id]: {
          tone: "error",
          message:
            questionState === "resolved"
              ? "Este pronóstico especial ya fue resuelto."
              : "Este pronóstico especial ya cerró.",
        },
      }));
      return;
    }

    const selectedOptionId = selectionState[question.id]?.selectedOptionId ?? null;

    if (!selectedOptionId) {
      setFeedback((current) => ({
        ...current,
        [question.id]: {
          tone: "error",
          message: "Elegí una opción antes de guardar.",
        },
      }));
      return;
    }

    setSavingQuestionId(question.id);
    setFeedback((current) => {
      const next = { ...current };
      delete next[question.id];
      return next;
    });

    startTransition(() => {
      void saveSpecialPredictionAction(question.id, selectedOptionId)
        .then((result) => {
          if (!result.ok) {
            setFeedback((current) => ({
              ...current,
              [question.id]: {
                tone: "error",
                message: result.message,
              },
            }));
            return;
          }

          setSelectionState((current) => ({
            ...current,
            [question.id]: {
              predictionId: result.prediction.id,
              selectedOptionId: result.prediction.option_id,
              savedOptionId: result.prediction.option_id,
              points: result.prediction.points,
              lockedAt: result.prediction.locked_at,
            },
          }));

          setFeedback((current) => ({
            ...current,
            [question.id]: {
              tone: "success",
              message: participationActive
                ? "Especial guardado. Ya suma cuando se resuelva."
                : "Especial guardado. Activá tu Pase para competir en el ranking.",
            },
          }));
        })
        .catch(() => {
          setFeedback((current) => ({
            ...current,
            [question.id]: {
              tone: "error",
              message: "No pudimos guardar el pronóstico especial. Probá de nuevo.",
            },
          }));
        })
        .finally(() => {
          setSavingQuestionId(null);
        });
    });
  }

  return (
    <div className="grid gap-4">
      <section className="overflow-hidden rounded-[1.35rem] border border-[rgba(0,71,171,0.12)] bg-[linear-gradient(180deg,#f8fbff_0%,#edf4ff_100%)] p-4 shadow-[0_10px_24px_rgba(0,50,125,0.06)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-primary)]">
          Pronósticos especiales
        </p>
        <h2 className="mt-2 font-serif text-[1.9rem] font-bold uppercase leading-[0.92] text-[var(--color-ink)]">
          Picks que mueven el ranking
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
          Cargá tus especiales por pregunta, seguí el cierre en tiempo real y dejá listo tu bonus antes del inicio.
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {highlightedPointBuckets.map((bucket) => (
            <div
              key={bucket.label}
              className="rounded-[1rem] border border-[rgba(0,71,171,0.12)] bg-white px-3 py-3 text-center shadow-[0_6px_16px_rgba(0,50,125,0.05)]"
            >
              <p className="font-serif text-[1.65rem] font-bold leading-none text-[var(--color-primary)]">
                {bucket.points}
              </p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                {bucket.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {!isAuthenticated ? (
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-sm leading-6 text-[var(--color-muted)]">
          Para guardar tus especiales,{" "}
          <Link href="/login" className="font-semibold text-[var(--color-primary)]">
            entrá al Prode
          </Link>
          .
        </div>
      ) : null}

      {isAuthenticated && !participationActive ? (
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-sm leading-6 text-[var(--color-muted)]">
          Tus especiales quedan guardados, pero para competir necesitás activar tu Pase Solidario.{" "}
          <Link href="/activar-pase" className="font-semibold text-[var(--color-primary)]">
            Activar mi Pase
          </Link>
          .
        </div>
      ) : null}

      {questions.map((question) => {
        const current = selectionState[question.id];
        const selectedOptionId = current?.selectedOptionId ?? null;
        const savedOptionId = current?.savedOptionId ?? null;
        const isDirty = selectedOptionId !== savedOptionId;
        const note = feedback[question.id];
        const questionState = getQuestionState(question, nowMs);
        const isOpen = questionState === "open";
        const saveDisabled = !isAuthenticated || !isOpen || !selectedOptionId || savingQuestionId === question.id;
        const buttonLabel =
          savingQuestionId === question.id || isPending
            ? "Guardando..."
            : !selectedOptionId
              ? "Elegí una opción"
              : !isOpen
                ? questionState === "scheduled"
                ? "Todavía no abre"
                  : questionState === "resolved"
                    ? "Resuelto"
                    : "Cerrado"
                : isDirty || !current?.predictionId
                  ? "Guardar selección"
                  : "Guardado";

        return (
          <article
            key={question.id}
            className="overflow-hidden rounded-[1.2rem] border-[1.5px] border-[var(--color-line)] bg-[var(--color-surface)] shadow-[0_10px_24px_rgba(0,50,125,0.05)]"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-primary)]">
                  {question.points} pts
                </p>
                <h3 className="mt-1 font-serif text-[1.35rem] font-bold uppercase leading-none text-[var(--color-ink)]">
                  {question.title}
                </h3>
                {question.description ? (
                  <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{question.description}</p>
                ) : null}
              </div>

              <span
                className={[
                  "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]",
                  questionState === "open"
                    ? "bg-[rgba(154,225,255,0.22)] text-[var(--color-secondary)]"
                    : questionState === "resolved"
                      ? "bg-[rgba(53,122,58,0.12)] text-[#2f6f37]"
                      : "bg-white text-[var(--color-muted)]",
                ].join(" ")}
              >
                {getStatusLabel(question, nowMs)}
              </span>
            </div>

            <div className="grid gap-3 p-4">
              <div className="flex flex-wrap items-center gap-2 text-[11px] leading-5 text-[var(--color-muted)]">
                <span className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-2.5 py-1">
                  {formatCountdown(question.closes_at, nowMs)}
                </span>
                <span className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-2.5 py-1">
                  Cierre: {formatCloseDate(question.closes_at)}
                </span>
                {savedOptionId ? (
                  <span className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-2.5 py-1">
                    Pick guardado
                  </span>
                ) : null}
              </div>

              {question.result_value ? (
                <div className="rounded-xl border border-[rgba(53,122,58,0.18)] bg-[rgba(53,122,58,0.08)] px-3 py-2 text-sm leading-6 text-[#2f6f37]">
                  Resultado oficial: {question.result_value}
                </div>
              ) : null}

              <div className="grid gap-2">
                {question.options.map((option) => {
                  const selected = selectedOptionId === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => selectOption(question.id, option.id)}
                      disabled={!isOpen || savingQuestionId === question.id}
                      className={[
                        "flex min-h-12 items-center justify-between gap-3 rounded-[1rem] border px-3 py-3 text-left transition",
                        selected
                          ? "border-[var(--color-primary)] bg-[rgba(0,71,171,0.08)] text-[var(--color-primary)]"
                          : "border-[var(--color-line)] bg-white text-[var(--color-ink)]",
                        !isOpen ? "cursor-not-allowed opacity-70" : "",
                      ].join(" ")}
                    >
                      <span className="text-sm font-semibold leading-5">{option.label}</span>
                      <span
                        className={[
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold",
                          selected
                            ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                            : "border-[var(--color-line)] bg-[var(--color-surface-muted)] text-[var(--color-muted)]",
                        ].join(" ")}
                      >
                        {selected ? "✓" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>

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
                onClick={() => saveQuestion(question)}
                disabled={saveDisabled}
                className="inline-flex min-h-11 items-center justify-center self-start rounded-xl border border-[#e7ca55] bg-[#ffe16d] px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {buttonLabel}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
