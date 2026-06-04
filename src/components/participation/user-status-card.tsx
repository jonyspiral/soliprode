import Link from "next/link";
import { SurfaceCard } from "@/components/surface-card";

type UserStatusCardProps = {
  alias: string;
  statusLabel: string;
  isPaid: boolean;
  teamName?: string | null;
  actionHref?: string;
};

export function UserStatusCard({
  alias,
  statusLabel,
  isPaid,
  teamName,
  actionHref = "/dashboard#solidarity-pass",
}: UserStatusCardProps) {
  return (
    <SurfaceCard
      title="Tu cuenta"
      description={
        isPaid
          ? "Tu estado ya está confirmado dentro del juego."
          : "Información rápida de tu estado actual."
      }
    >
      <div className="grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
              Jugador
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">{alias}</p>
          </div>
          <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
              Estado
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">{statusLabel}</p>
          </div>
          <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
              Team
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">{teamName ?? "Todavía sin Team"}</p>
          </div>
          <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
              Pase Solidario
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">
              {isPaid ? "Aporte confirmado" : "Pendiente"}
            </p>
          </div>
        </div>

        {isPaid ? (
          <p className="rounded-xl border border-[#8bd3a5] bg-[#eef9f1] px-4 py-3 text-sm text-[#1f6b37]">
            Jugador activo. Ya estás compitiendo oficialmente.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <p className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-ink)]">
              Debés terminar tu inscripción para competir.
            </p>
            <Link
              href={actionHref}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#e7ca55] bg-[#ffe16d] px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-ink)]"
            >
              Completar inscripción
            </Link>
          </div>
        )}
      </div>
    </SurfaceCard>
  );
}
