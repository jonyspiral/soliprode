"use client";

import { useState } from "react";

type CaptainBonusShareActionsProps = {
  captainMessage: string;
  captainWhatsappHref: string | null;
  captainBonusLink: string;
  teamInviteLink: string | null;
  teamMessage: string | null;
  teamMessageUnavailableText?: string | null;
};

export function CaptainBonusShareActions({
  captainMessage,
  captainWhatsappHref,
  captainBonusLink,
  teamInviteLink,
  teamMessage,
  teamMessageUnavailableText = null,
}: CaptainBonusShareActionsProps) {
  const [feedback, setFeedback] = useState<string | null>(null);

  function showFeedback(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), 1800);
  }

  async function copyText(value: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(value);
      showFeedback(successMessage);
    } catch {
      showFeedback("No pudimos copiar ahora.");
    }
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        {captainWhatsappHref ? (
          <a
            href={captainWhatsappHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-lg border border-[#e7ca55] bg-[#ffe16d] px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-ink)]"
          >
            Abrir WhatsApp: mensaje para él
          </a>
        ) : null}
        <button
          type="button"
          onClick={() => void copyText(captainMessage, "Mensaje para él copiado")}
          className="inline-flex items-center justify-center rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-ink)]"
        >
          Copiar mensaje para él
        </button>
        <button
          type="button"
          onClick={() => {
            if (teamMessage) {
              void copyText(teamMessage, "Mensaje para el Team copiado");
            }
          }}
          disabled={!teamMessage}
          className="inline-flex items-center justify-center rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-ink)]"
        >
          Copiar mensaje para reenviar al Team
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void copyText(captainBonusLink, "Link de Capitán Bonificado copiado")}
          className="inline-flex items-center justify-center rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-ink)]"
        >
          Copiar link de Capitán Bonificado
        </button>
        <button
          type="button"
          onClick={() => {
            if (teamInviteLink) {
              void copyText(teamInviteLink, "Link de invitación al Team copiado");
            }
          }}
          disabled={!teamInviteLink}
          className="inline-flex items-center justify-center rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-ink)]"
        >
          Copiar link de invitación al Team
        </button>
      </div>
      {!teamMessage && teamMessageUnavailableText ? (
        <p className="text-xs text-[var(--color-muted)]">{teamMessageUnavailableText}</p>
      ) : null}
      {feedback ? <p className="text-xs text-[var(--color-muted)]">{feedback}</p> : null}
    </div>
  );
}
