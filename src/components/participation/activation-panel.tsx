"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CompleteRegistrationButton } from "@/components/participation/complete-registration-button";
import { SOLIPRODE_RULES_VERSION } from "@/lib/rules";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { entryConfig, formatEntryPrice } from "@/lib/product/entry-config";
import { resolveParticipationUiState } from "@/lib/participations/status";

type ActivationPanelProps = {
  participationId: string | null;
  participationStatus: string;
  initialRulesAcceptedAt: string | null;
  initialRulesVersion: string | null;
  initialIsAdultConfirmed: boolean;
};

export function ActivationPanel({
  participationId,
  participationStatus,
  initialRulesAcceptedAt,
  initialRulesVersion,
  initialIsAdultConfirmed,
}: ActivationPanelProps) {
  const [acceptedRules, setAcceptedRules] = useState(
    Boolean(initialIsAdultConfirmed && initialRulesAcceptedAt && initialRulesVersion === SOLIPRODE_RULES_VERSION),
  );
  const [savingAcceptance, setSavingAcceptance] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const priceLabel = useMemo(() => formatEntryPrice(entryConfig.initialPrice), []);
  const participationUiState = resolveParticipationUiState(participationStatus);

  async function persistRulesAcceptance() {
    if (!participationId) {
      setFeedback("No encontramos tu participación todavía. Reintentá en unos minutos.");
      return false;
    }

    if (!acceptedRules) {
      setFeedback("Para continuar, tenés que declarar mayoría de edad y aceptar el reglamento.");
      return false;
    }

    setSavingAcceptance(true);
    setFeedback(null);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase
        .from("participations")
        .update({
          rules_accepted_at: new Date().toISOString(),
          rules_version: SOLIPRODE_RULES_VERSION,
          is_adult_confirmed: true,
        })
        .eq("id", participationId);

      if (error) {
        throw error;
      }

      return true;
    } catch {
      setFeedback("No pudimos guardar la aceptación del reglamento ahora. Intentá de nuevo.");
      return false;
    } finally {
      setSavingAcceptance(false);
    }
  }

  if (participationStatus === "paid") {
    return (
      <div className="grid gap-4 rounded-[1.25rem] border border-[#8bd3a5] bg-[#eef9f1] p-5">
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

  if (participationUiState.isPendingReview) {
    return (
      <div className="grid gap-4 rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-5">
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
    <div className="grid gap-4 rounded-[1.35rem] border-[1.5px] border-[var(--color-gold)] bg-[rgba(255,225,109,0.14)] p-5 shadow-[0_10px_24px_rgba(0,50,125,0.05)]">
      <div className="grid gap-5">
        <div className="grid gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
            Pase Solidario
          </p>
          <h1 className="font-serif text-[2rem] font-bold leading-none text-[var(--color-ink)]">
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
            <p className="font-serif text-[2.5rem] font-bold leading-none text-[var(--color-primary)]">
              {priceLabel}
            </p>
          </div>
          <p className="mt-2 text-sm leading-6 text-[var(--color-ink)]">
            Pago único. Activación inmediata.
          </p>
        </div>
        <div className="rounded-xl border border-[var(--color-line)] bg-white/80 p-4">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={acceptedRules}
              onChange={(event) => setAcceptedRules(event.target.checked)}
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
        <div className="grid gap-3">
          <CompleteRegistrationButton
            disabled={savingAcceptance}
            helperText={!acceptedRules ? "Aceptá el reglamento para habilitar la activación del Pase." : null}
            onBeforeStart={() => persistRulesAcceptance()}
          />
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            No necesitás cuenta de Mercado Pago. Podés pagar con tarjeta, efectivo o transferencia bancaria según los medios disponibles.
          </p>
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            Pago seguro procesado por Mercado Pago.
          </p>
          {feedback ? (
            <p className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm leading-6 text-[var(--color-muted)]">
              {feedback}
            </p>
          ) : null}
        </div>
        <div className="rounded-xl border border-[var(--color-line)] bg-white/80 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
            Qué desbloquea
          </p>
          <div className="mt-3 grid gap-2 text-sm leading-6 text-[var(--color-ink)]">
            <p>• Cargar tus pronósticos</p>
            <p>• Competir por el pozo individual</p>
            <p>• Crear o sumarte a un Team</p>
            <p>• Ayudar a financiar la tesis universitaria</p>
          </div>
        </div>
      </div>
    </div>
  );
}
