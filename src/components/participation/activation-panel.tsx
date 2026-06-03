"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { EntryCountdown } from "@/components/payments/entry-countdown";
import { CompleteRegistrationButton } from "@/components/participation/complete-registration-button";
import { MercadoPagoBadge } from "@/components/payments/mercado-pago-badge";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { entryConfig, formatEntryPrice } from "@/lib/product/entry-config";
import { resolveParticipationUiState } from "@/lib/participations/status";

type ActivationPanelProps = {
  participationId: string | null;
  participationStatus: string;
  draftCount: number;
  initialPaymentReference: string | null;
  initialPaymentSubmittedAt: string | null;
};

export function ActivationPanel({
  participationId,
  participationStatus,
  draftCount,
  initialPaymentReference,
  initialPaymentSubmittedAt,
}: ActivationPanelProps) {
  const [showFallback, setShowFallback] = useState(false);
  const [paymentReference, setPaymentReference] = useState(initialPaymentReference ?? "");
  const [paymentSubmittedAt, setPaymentSubmittedAt] = useState(initialPaymentSubmittedAt);
  const [savingReference, setSavingReference] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const priceLabel = useMemo(() => formatEntryPrice(entryConfig.initialPrice), []);
  const participationUiState = resolveParticipationUiState(participationStatus);

  async function saveReference() {
    if (!participationId) {
      setFeedback("No encontramos tu participación todavía. Reintentá en unos minutos.");
      return;
    }

    setSavingReference(true);
    setFeedback(null);

    try {
      const supabase = createBrowserSupabaseClient();
      const nextPaymentSubmittedAt =
        paymentReference.trim() && !paymentSubmittedAt
          ? new Date().toISOString()
          : paymentSubmittedAt;
      const { error } = await supabase
        .from("participations")
        .update({
          payment_reference: paymentReference.trim() || null,
          payment_submitted_at: nextPaymentSubmittedAt,
        })
        .eq("id", participationId);

      if (error) {
        throw error;
      }

      setPaymentSubmittedAt(nextPaymentSubmittedAt);

      setFeedback(
        paymentReference.trim()
          ? "Referencia guardada. Tu pago manual queda pendiente hasta confirmación admin."
          : "Referencia borrada. Podés volver a cargarla si necesitás informar un pago manual.",
      );
    } catch {
      setFeedback("No pudimos guardar la referencia ahora. Intentá de nuevo.");
    } finally {
      setSavingReference(false);
    }
  }

  if (participationStatus === "paid") {
    return (
      <div className="grid gap-4">
      <div className="rounded-lg border border-[#8bd3a5] bg-[#eef9f1] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#1f6b37]">
            Participación activa
          </p>
          <p className="mt-2 font-serif text-[1.9rem] font-bold uppercase text-[var(--color-primary)]">
            Ya estás compitiendo por premios
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Tus próximos pronósticos ya juegan por ranking oficial, grupo y premio.
          </p>
        </div>

        <Link
          href="/matches"
          className="inline-flex items-center justify-center rounded-lg border border-[#e7ca55] bg-[#ffe16d] px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-ink)]"
        >
          Ir a mis pronósticos
        </Link>
      </div>
    );
  }

  if (participationUiState.isPendingReview) {
    return (
      <div className="grid gap-4">
        <div className="rounded-[1.25rem] border-[1.5px] border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-[0_10px_24px_rgba(0,50,125,0.05)]">
          <div className="grid gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
              Estado de inscripción
            </p>
            <h3 className="font-serif text-[1.9rem] font-bold uppercase leading-none text-[var(--color-ink)]">
              Estamos verificando tu inscripción
            </h3>
            <p className="text-sm leading-6 text-[var(--color-muted)]">
              Tus pronósticos quedan guardados. Cuando el pago quede confirmado, pasan a competir.
            </p>
            <MercadoPagoBadge compact secondaryText="Seguimos esperando confirmación final" className="w-fit" />
            <Link
              href="/matches"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm font-semibold text-[var(--color-ink)]"
            >
              Ver pronósticos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-[1.25rem] border-[1.5px] border-[var(--color-gold)] bg-[rgba(255,225,109,0.14)] p-4 shadow-[0_10px_24px_rgba(0,50,125,0.05)]">
        <div className="grid gap-4">
          <div className="grid gap-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
              Inscripción inicial
            </p>
            <h3 className="font-serif text-[1.9rem] font-bold uppercase leading-none text-[var(--color-ink)]">
              Completá tu inscripción
            </h3>
          </div>
          <div className="flex items-end justify-between gap-3">
            <p className="font-serif text-[2.5rem] font-bold leading-none text-[var(--color-primary)]">
              {priceLabel}
            </p>
            <MercadoPagoBadge compact secondaryText="" className="min-w-0 px-2 py-1.5 text-[11px]" />
          </div>
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            {participationUiState.statusLabel}
          </p>
          <EntryCountdown className="bg-white/70" />
          <div className="grid gap-3">
            <CompleteRegistrationButton />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                Pago manual
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                Si Mercado Pago falla, podés dejar una referencia.
              </p>
            </div>
            <span className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
              {draftCount} pronóstico{draftCount === 1 ? "" : "s"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowFallback((current) => !current)}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm font-semibold text-[var(--color-ink)]"
          >
            {showFallback ? "Ocultar opción manual" : "Tuve un problema con Mercado Pago"}
          </button>
        </div>

        {showFallback ? (
          <div className="mt-4 grid gap-3">
            <label className="grid gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                Referencia
              </span>
              <input
                value={paymentReference}
                onChange={(event) => setPaymentReference(event.target.value)}
                placeholder="Alias, transferencia o nota para identificar el pago"
                className="min-h-12 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-ink)] outline-none"
              />
            </label>
            {feedback ? (
              <p className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm leading-6 text-[var(--color-muted)]">
                {feedback}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => void saveReference()}
              disabled={savingReference}
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {savingReference ? "Guardando..." : "Guardar referencia"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
