"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  confirmParticipationAction,
  rejectParticipationAction,
} from "@/app/admin/actions";

type PaymentReviewActionsProps = {
  participantName: string;
  participationId: string;
};

type PendingAction = "confirm" | "reject" | null;

export function PaymentReviewActions({
  participantName,
  participationId,
}: PaymentReviewActionsProps) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const isBusy = isPending && pendingAction !== null;

  function closeModal() {
    if (isBusy) {
      return;
    }

    setPendingAction(null);
    setReason("");
  }

  function runAction(action: Exclude<PendingAction, null>) {
    setError(null);
    setMessage(null);

    const formData = new FormData();
    formData.set("participation_id", participationId);

    if (action === "reject") {
      formData.set("reason", reason);
    }

    startTransition(async () => {
      const result =
        action === "confirm"
          ? await confirmParticipationAction(formData)
          : await rejectParticipationAction(formData);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setPendingAction(null);
      setReason("");
      setMessage(result.message);
      router.refresh();
    });
  }

  return (
    <>
      <div className="grid gap-2 sm:min-w-[180px]">
        <button
          type="button"
          onClick={() => {
            setError(null);
            setMessage(null);
            setPendingAction("confirm");
          }}
          disabled={isBusy}
          className="inline-flex w-full items-center justify-center rounded-lg border border-[#e7ca55] bg-[#ffe16d] px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isBusy && pendingAction === "confirm" ? "Confirmando..." : "Confirmar pago"}
        </button>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setMessage(null);
            setPendingAction("reject");
          }}
          disabled={isBusy}
          className="inline-flex w-full items-center justify-center rounded-lg border border-[var(--color-line)] bg-white px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isBusy && pendingAction === "reject" ? "Rechazando..." : "Rechazar pago"}
        </button>
      </div>

      {message ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
          {message}
        </p>
      ) : null}

      {pendingAction ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="payment-review-title"
        >
          <div className="w-full max-w-md rounded-lg border border-[var(--color-line)] bg-white p-5 shadow-xl">
            <div className="grid gap-3">
              <h2 id="payment-review-title" className="text-lg font-bold text-[var(--color-ink)]">
                {pendingAction === "confirm"
                  ? `¿Confirmar manualmente el pago de ${participantName}?`
                  : `¿Rechazar el pago de ${participantName}?`}
              </h2>
              <p className="text-sm leading-6 text-[var(--color-muted)]">
                {pendingAction === "confirm"
                  ? "Esta acción habilitará su participación en SoliProde."
                  : "Esta acción marcará el intento como rechazado sin borrar registros."}
              </p>

              {pendingAction === "reject" ? (
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                    Motivo opcional
                  </span>
                  <textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    disabled={isBusy}
                    rows={3}
                    className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
                  />
                </label>
              ) : null}

              {error ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
                  {error}
                </p>
              ) : null}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isBusy}
                  className="inline-flex items-center justify-center rounded-lg border border-[var(--color-line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => runAction(pendingAction)}
                  disabled={isBusy}
                  className="inline-flex items-center justify-center rounded-lg border border-[#e7ca55] bg-[#ffe16d] px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {pendingAction === "confirm"
                    ? isBusy
                      ? "Confirmando..."
                      : "Confirmar pago"
                    : isBusy
                      ? "Rechazando..."
                      : "Rechazar pago"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
