"use client";

import { useState } from "react";

type CaptainBonusShareActionsProps = {
  claimUrl: string;
  inviteMessage: string;
  whatsappHref: string;
};

export function CaptainBonusShareActions({
  claimUrl,
  inviteMessage,
  whatsappHref,
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

  async function inviteByWhatsapp() {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "SoliProde",
          text: inviteMessage,
          url: claimUrl,
        });
        showFeedback("Invitación compartida.");
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
      }
    }

    window.open(whatsappHref, "_blank", "noopener,noreferrer");
    showFeedback("Abriendo WhatsApp.");
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void inviteByWhatsapp()}
          className="inline-flex items-center justify-center rounded-lg border border-[#e7ca55] bg-[#ffe16d] px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-ink)]"
        >
          Invitar por WhatsApp
        </button>
        <button
          type="button"
          onClick={() => void copyText(inviteMessage, "Mensaje copiado")}
          className="inline-flex items-center justify-center rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-ink)]"
        >
          Copiar mensaje
        </button>
        <button
          type="button"
          onClick={() => void copyText(claimUrl, "Link copiado")}
          className="inline-flex items-center justify-center rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-ink)]"
        >
          Copiar link
        </button>
      </div>
      {feedback ? <p className="text-xs text-[var(--color-muted)]">{feedback}</p> : null}
    </div>
  );
}
