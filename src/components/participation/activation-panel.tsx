"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { EntryCountdown } from "@/components/payments/entry-countdown";
import { MercadoPagoBadge } from "@/components/payments/mercado-pago-badge";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { entryConfig, formatEntryPrice } from "@/lib/product/entry-config";

type ActivationPanelProps = {
  participationId: string | null;
  participationStatus: string;
  draftCount: number;
  initialPaymentReference: string | null;
};

export function ActivationPanel({
  participationId,
  participationStatus,
  draftCount,
  initialPaymentReference,
}: ActivationPanelProps) {
  const [showFallback, setShowFallback] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);
  const [startingCheckout, setStartingCheckout] = useState(false);
  const [paymentReference, setPaymentReference] = useState(initialPaymentReference ?? "");
  const [savingReference, setSavingReference] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const priceLabel = useMemo(() => formatEntryPrice(entryConfig.initialPrice), []);

  async function saveReference() {
    if (!participationId) {
      setFeedback("No encontramos tu participación todavía. Reintentá en unos minutos.");
      return;
    }

    setSavingReference(true);
    setFeedback(null);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase
        .from("participations")
        .update({
          payment_reference: paymentReference.trim() || null,
        })
        .eq("id", participationId);

      if (error) {
        throw error;
      }

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

  async function startMercadoPagoCheckout() {
    setStartingCheckout(true);
    setPaymentNotice(null);

    try {
      const response = await fetch("/api/payments/mercadopago/create-preference", {
        method: "POST",
      });
      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        checkoutUrl?: string;
      };

      if (!response.ok || !payload.ok || !payload.checkoutUrl) {
        setPaymentNotice(payload.error ?? "No pudimos iniciar el pago online en este momento.");
        return;
      }

      window.location.assign(payload.checkoutUrl);
    } catch {
      setPaymentNotice("No pudimos iniciar el pago online en este momento.");
    } finally {
      setStartingCheckout(false);
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
            Tus pronósticos futuros ya cuentan para ranking oficial, grupo y premios.
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

  return (
    <div className="grid gap-4">
      <div className="rounded-lg border-[1.5px] border-[var(--color-gold)] bg-[rgba(255,225,109,0.14)] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
          Inscripción inicial
        </p>
        <div className="mt-2 grid gap-3">
          <p className="font-serif text-[2.5rem] font-bold leading-none text-[var(--color-primary)]">
            {priceLabel}
          </p>
          <EntryCountdown className="bg-white/70" />
        </div>
        <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
          Disponible por tiempo limitado. Cuando termine la cuenta regresiva, la inscripción puede aumentar.
        </p>
      </div>

      <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
          Estado actual
        </p>
        <p className="mt-2 font-serif text-[1.85rem] font-bold uppercase text-[var(--color-primary)]">
          Tus pronósticos están en borrador
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
          {draftCount > 0
            ? `Ya tenés ${draftCount} pronóstico${draftCount === 1 ? "" : "s"} guardado${draftCount === 1 ? "" : "s"}.`
            : "Todavía no pagaste tu participación."}{" "}
          Para competir por premios y aparecer en rankings, pagá tu participación.
        </p>
      </div>

      <MercadoPagoBadge compact secondaryText="Pago online seguro" />

      <div className="grid gap-3">
        <button
          type="button"
          onClick={() => void startMercadoPagoCheckout()}
          disabled={startingCheckout}
          className="inline-flex items-center justify-center rounded-lg border border-[#e7ca55] bg-[#ffe16d] px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-ink)]"
        >
          {startingCheckout ? "Abriendo Mercado Pago..." : "Pagar con Mercado Pago"}
        </button>
        <p className="text-sm leading-6 text-[var(--color-muted)]">
          Activás tu participación y tus pronósticos empiezan a competir por premios.
        </p>
        {paymentNotice ? (
          <p className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-sm leading-6 text-[var(--color-muted)]">
            {paymentNotice}
          </p>
        ) : null}
      </div>

      <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
              Fallback operativo
            </p>
            <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
              Si tuviste un problema con Mercado Pago, podés informar un pago manual para que el admin lo revise.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowFallback((current) => !current)}
              className="inline-flex items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm font-semibold text-[var(--color-ink)]"
            >
              {showFallback ? "Ocultar fallback manual" : "Tuve un problema con Mercado Pago"}
            </button>
          </div>
        </div>

        {showFallback ? (
          <div className="mt-4 grid gap-3">
            <label className="grid gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                Informar pago manual
              </span>
              <input
                value={paymentReference}
                onChange={(event) => setPaymentReference(event.target.value)}
                placeholder="Alias, transferencia o nota para que el admin te identifique"
                className="min-h-12 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-ink)] outline-none"
              />
            </label>
            {feedback ? (
              <p className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm leading-6 text-[var(--color-muted)]">
                {feedback}
              </p>
            ) : null}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/matches"
                className="inline-flex items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm font-semibold text-[var(--color-ink)]"
              >
                Seguir cargando pronósticos
              </Link>
              <button
                type="button"
                onClick={() => void saveReference()}
                disabled={savingReference}
                className="inline-flex items-center justify-center rounded-lg bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {savingReference ? "Guardando..." : "Informar pago manual"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
