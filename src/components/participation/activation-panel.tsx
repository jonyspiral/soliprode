"use client";

import { useMemo } from "react";
import Link from "next/link";
import { SOLIPRODE_RULES_VERSION } from "@/lib/rules";
import { entryConfig, formatEntryCountdown, formatEntryPrice } from "@/lib/product/entry-config";
import { resolveParticipationUiState } from "@/lib/participations/status";

type ActivationPanelProps = {
  participationId: string | null;
  participationStatus: string;
  initialCheckoutError?: string | null;
  initialRulesAcceptedAt: string | null;
  initialRulesVersion: string | null;
  initialIsAdultConfirmed: boolean;
};

export function ActivationPanel({
  participationId,
  participationStatus,
  initialCheckoutError = null,
  initialRulesAcceptedAt,
  initialRulesVersion,
  initialIsAdultConfirmed,
}: ActivationPanelProps) {
  const priceLabel = useMemo(() => formatEntryPrice(entryConfig.initialPrice), []);
  const countdownLabel = useMemo(() => formatEntryCountdown(), []);
  const rulesAcceptedByDefault = Boolean(
    initialIsAdultConfirmed && initialRulesAcceptedAt && initialRulesVersion === SOLIPRODE_RULES_VERSION,
  );
  const participationUiState = resolveParticipationUiState(participationStatus);

  if (participationStatus === "paid") {
    return (
      <div className="grid gap-4 rounded-[1.25rem] border border-[#8bd3a5] bg-[#eef9f1] p-4 sm:p-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#1f6b37]">
            Pase Solidario
          </p>
          <h2 className="mt-2 font-serif text-[1.9rem] font-bold leading-none text-[var(--color-primary)]">
            Tu Pase Solidario ya está activo
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
            Ya podés cargar pronósticos, armar tu Team y competir por premios.
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

  if (participationUiState.isRetryableCheckout) {
    return (
      <div className="grid gap-4 rounded-[1.25rem] border border-[var(--color-gold)] bg-[rgba(255,225,109,0.12)] p-4 shadow-[0_10px_24px_rgba(0,50,125,0.05)] sm:p-5">
        <div className="grid gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
            Pase Solidario
          </p>
          <h1 className="font-serif text-[1.85rem] font-bold leading-none text-[var(--color-ink)]">
            Terminá de activar tu Pase
          </h1>
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            Tu activación sigue sin confirmarse. Podés continuar o reintentar el checkout ahora mismo.
          </p>
        </div>

        <div className="rounded-[1rem] border border-white/80 bg-white/90 p-4">
          <div className="grid gap-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
              Precio actual
            </p>
            <p className="font-serif text-[2.25rem] font-bold leading-none text-[var(--color-primary)]">
              {priceLabel}
            </p>
          </div>
          <p className="mt-2 text-sm leading-6 text-[var(--color-ink)]">Pago único. Activación inmediata.</p>
        </div>

        <form action="/api/payments/mercadopago/start-checkout" method="post" className="grid gap-3">
          {!rulesAcceptedByDefault ? (
            <div className="rounded-xl border border-[var(--color-line)] bg-white/80 p-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="accepted_rules"
                  value="true"
                  required
                  className="mt-1 h-5 w-5 accent-[var(--color-primary)]"
                />
                <span className="text-sm leading-6 text-[var(--color-ink)]">
                  Declaro que soy mayor de 18 años y acepto el reglamento de SoliProde.
                </span>
              </label>
              <Link
                href="/reglamento"
                className="mt-3 inline-flex text-sm font-semibold text-[var(--color-primary)] underline underline-offset-2"
              >
                Ver reglamento
              </Link>
            </div>
          ) : null}
          <input type="hidden" name="participation_id" value={participationId ?? ""} />
          <button
            type="submit"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#e7ca55] bg-[#ffe16d] px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-ink)]"
          >
            Continuar con el pago
          </button>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] leading-5 text-[var(--color-muted)]">
            <span>{`Precio promocional · ${countdownLabel}`}</span>
            <span>No necesitás cuenta de Mercado Pago</span>
          </div>
        </form>

        <p className="text-sm leading-6 text-[var(--color-muted)]">
          No necesitás cuenta de Mercado Pago. Podés pagar con tarjeta, efectivo o transferencia bancaria según los medios disponibles.
        </p>

        {initialCheckoutError ? (
          <p className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm leading-6 text-[var(--color-muted)]">
            {initialCheckoutError}
          </p>
        ) : null}
      </div>
    );
  }

  if (participationUiState.isPendingReview) {
    return (
      <div className="grid gap-4 rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4 sm:p-5">
        <div className="grid gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-primary)]">
            Pase Solidario
          </p>
          <h2 className="font-serif text-[1.75rem] font-bold leading-none text-[var(--color-ink)]">
            Tu pago está en revisión
          </h2>
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            Cuando Mercado Pago confirme la operación, tu Pase Solidario se activa automáticamente.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/pago/pending"
              className="inline-flex items-center justify-center rounded-lg border border-[#e7ca55] bg-[#ffe16d] px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-ink)]"
            >
              Ver estado del pago
            </Link>
            <Link
              href="/matches"
              className="inline-flex items-center justify-center rounded-lg border border-[var(--color-line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--color-ink)]"
            >
              Volver a pronósticos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 rounded-[1.35rem] border-[1.5px] border-[var(--color-gold)] bg-[rgba(255,225,109,0.14)] p-4 shadow-[0_10px_24px_rgba(0,50,125,0.05)] sm:p-5">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
            Pase Solidario
          </p>
          <h1 className="font-serif text-[1.95rem] font-bold leading-none text-[var(--color-ink)] sm:text-[2rem]">
            Activá tu Pase Solidario
          </h1>
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            Con tu pase activo ya podés cargar pronósticos, armar tu Team y competir por premios.
          </p>
        </div>
        <div className="rounded-[1rem] border border-white/80 bg-white/80 p-4">
          <div className="grid gap-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
              Precio actual
            </p>
            <p className="font-serif text-[2.25rem] font-bold leading-none text-[var(--color-primary)] sm:text-[2.5rem]">
              {priceLabel}
            </p>
          </div>
          <p className="mt-2 text-sm leading-6 text-[var(--color-ink)]">
            Pago único. Activación inmediata.
          </p>
        </div>
        <form action="/api/payments/mercadopago/start-checkout" method="post" className="grid gap-3">
          <div className="rounded-xl border border-[var(--color-line)] bg-white/80 p-4">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                name="accepted_rules"
                value="true"
                required={!rulesAcceptedByDefault}
                defaultChecked={rulesAcceptedByDefault}
                className="mt-1 h-5 w-5 accent-[var(--color-primary)]"
              />
              <span className="text-sm leading-6 text-[var(--color-ink)]">
                Declaro que soy mayor de 18 años y acepto el reglamento de SoliProde.
              </span>
            </label>
            <Link
              href="/reglamento"
              className="mt-3 inline-flex text-sm font-semibold text-[var(--color-primary)] underline underline-offset-2"
            >
              Ver reglamento
            </Link>
          </div>
          <input type="hidden" name="participation_id" value={participationId ?? ""} />
          <button
            type="submit"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#e7ca55] bg-[#ffe16d] px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-ink)]"
          >
            Pagar y activar mi Pase
          </button>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] leading-5 text-[var(--color-muted)]">
            <span>{`Precio promocional · ${countdownLabel}`}</span>
            <span>No necesitás cuenta de Mercado Pago</span>
          </div>
        </form>
        <p className="text-sm leading-6 text-[var(--color-muted)]">
          No necesitás cuenta de Mercado Pago. Podés pagar con tarjeta, efectivo o transferencia bancaria según los medios disponibles.
        </p>
        <p className="text-sm leading-6 text-[var(--color-muted)]">
          Pago seguro procesado por Mercado Pago.
        </p>
        {initialCheckoutError ? (
          <p className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm leading-6 text-[var(--color-muted)]">
            {initialCheckoutError}
          </p>
        ) : null}
        <details className="rounded-xl border border-[var(--color-line)] bg-white/80 p-4">
          <summary className="cursor-pointer list-none text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
            Qué desbloquea
          </summary>
          <div className="mt-3 grid gap-2 text-sm leading-6 text-[var(--color-ink)]">
            <p>• Cargar tus pronósticos</p>
            <p>• Competir por el pozo individual</p>
            <p>• Crear o sumarte a un Team</p>
            <p>• Ayudar a financiar la tesis universitaria</p>
          </div>
        </details>
      </div>
    </div>
  );
}
