"use client";

import { useState } from "react";
import { TEAM_PASS_MAX_SLOTS, type TeamPassSummary } from "@/lib/team-passes/contracts";

type TeamPassPanelProps = {
  canManage: boolean;
  teamId: string | null;
  summary: TeamPassSummary | null;
};

async function createTeamPassCheckout(input: {
  teamId: string;
  slotQuantity: number;
}) {
  const response = await fetch("/api/payments/mercadopago/create-team-pass-preference", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  const payload = (await response.json()) as {
    ok?: boolean;
    error?: string;
    checkoutUrl?: string;
  };

  if (!response.ok || !payload.ok || !payload.checkoutUrl) {
    throw new Error(payload.error ?? "No pudimos abrir el checkout de cupos ahora.");
  }

  return payload.checkoutUrl;
}

function TeamPassInviteButtons({ inviteUrl }: { inviteUrl: string }) {
  const [notice, setNotice] = useState<string | null>(null);

  async function copyLink() {
    const absoluteUrl = `${window.location.origin}${inviteUrl}`;
    await navigator.clipboard.writeText(absoluteUrl);
    setNotice("Link copiado");
  }

  async function shareLink() {
    const absoluteUrl = `${window.location.origin}${inviteUrl}`;

    if (navigator.share) {
      await navigator.share({
        title: "SoliProde",
        text: "Te dejaron un cupo prepago en este Team de SoliProde.",
        url: absoluteUrl,
      });
      setNotice("Invitación lista");
      return;
    }

    await copyLink();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => void copyLink()}
        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-xs font-semibold text-[var(--color-ink)]"
      >
        Copiar invitación
      </button>
      <button
        type="button"
        onClick={() => void shareLink()}
        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#e7ca55] bg-[#ffe16d] px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-ink)]"
      >
        Invitar jugador
      </button>
      {notice ? <span className="text-[11px] text-[var(--color-muted)]">{notice}</span> : null}
    </div>
  );
}

export function TeamPassPanel({ canManage, teamId, summary }: TeamPassPanelProps) {
  const [slotQuantity, setSlotQuantity] = useState(1);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSlots = summary?.totalSlots ?? 0;
  const usedSlots = summary?.usedSlots ?? 0;
  const pendingSlots = summary?.pendingSlots ?? 0;
  const activePlayers = summary?.activePlayers ?? 0;
  const pendingInvites = (summary?.invites ?? []).filter((invite) => invite.status === "pending");

  async function handlePurchase() {
    if (!canManage || !teamId || pending) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      const checkoutUrl = await createTeamPassCheckout({
        teamId,
        slotQuantity,
      });

      window.location.assign(checkoutUrl);
    } catch (purchaseError) {
      setError(
        purchaseError instanceof Error && purchaseError.message
          ? purchaseError.message
          : "No pudimos abrir el checkout de cupos ahora.",
      );
      setPending(false);
    }
  }

  return (
    <article className="rounded-[1.1rem] border-[1.5px] border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-[0_8px_18px_rgba(0,50,125,0.05)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
            Pase de equipo
          </p>
          <h3 className="font-serif text-[1.25rem] font-bold uppercase text-[var(--color-primary)]">
            Cupos prepagos para tu Team
          </h3>
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            Los cupos vacíos no crean jugadores ni suman puntos. Cada invitado real activa su lugar con cuenta propia.
          </p>
          <p className="text-sm font-medium leading-6 text-[var(--color-ink)]">
            Mientras antes reclamen sus cupos, antes empiezan a sumar para el equipo.
          </p>
        </div>
        {canManage && teamId ? (
          <div className="flex flex-wrap items-end gap-2">
            <label className="grid gap-1 text-sm text-[var(--color-muted)]">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">Cupos</span>
              <select
                value={slotQuantity}
                onChange={(event) => setSlotQuantity(Number(event.target.value))}
                className="min-h-11 rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm text-[var(--color-ink)]"
              >
                {Array.from({ length: TEAM_PASS_MAX_SLOTS }, (_, index) => index + 1).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => void handlePurchase()}
              disabled={pending}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#e7ca55] bg-[#ffe16d] px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Abriendo checkout..." : "Comprar cupos"}
            </button>
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="mt-3 rounded-lg border border-[rgba(186,26,26,0.18)] bg-[rgba(186,26,26,0.08)] px-3 py-2 text-sm text-[var(--color-error)]">
          {error}
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">Pases comprados</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-ink)]">{totalSlots}</p>
        </div>
        <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">Cupos usados</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-ink)]">{usedSlots}</p>
        </div>
        <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">Jugadores activos reales</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-ink)]">{activePlayers}</p>
        </div>
        <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">Cupos pendientes</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-ink)]">{pendingSlots}</p>
        </div>
      </div>

      {canManage ? (
        <div className="mt-4 grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
              Invitaciones prepagas
            </h4>
            <span className="text-xs text-[var(--color-muted)]">
              {pendingInvites.length > 0 ? `${pendingInvites.length} disponibles` : "Sin cupos pendientes"}
            </span>
          </div>

          {pendingInvites.length > 0 ? (
            pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex flex-col gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-3 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--color-ink)]">Disponible</p>
                  <p className="text-sm text-[var(--color-muted)]">Código: {invite.code}</p>
                  <p className="text-xs text-[var(--color-muted)]">{invite.inviteUrl}</p>
                </div>
                <TeamPassInviteButtons inviteUrl={invite.inviteUrl} />
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-[var(--color-line)] bg-[var(--color-surface-muted)] p-3 text-sm text-[var(--color-muted)]">
              No hay invitaciones pendientes. Cuando compres o te queden cupos sin usar, van a aparecer acá.
            </div>
          )}
        </div>
      ) : null}
    </article>
  );
}
