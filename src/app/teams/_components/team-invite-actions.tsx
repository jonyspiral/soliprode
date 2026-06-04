"use client";

import { useMemo, useState } from "react";

type TeamInviteActionsProps = {
  inviteCode: string;
};

function resolveBaseUrl() {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim() ?? "";

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin.replace(/\/+$/, "");
  }

  return "";
}

export function TeamInviteActions({ inviteCode }: TeamInviteActionsProps) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const teamInviteUrl = useMemo(() => {
    const baseUrl = resolveBaseUrl();
    return `${baseUrl}/groups?code=${inviteCode}`;
  }, [inviteCode]);
  const whatsappMessage = useMemo(
    () =>
      `Sumate a mi Team en SoliProde.\n\nEntran todos. Puntúan los mejores 11.\n\nEntrá acá:\n${teamInviteUrl}`,
    [teamInviteUrl],
  );
  const whatsappHref = useMemo(
    () => `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`,
    [whatsappMessage],
  );

  function showFeedback(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), 1800);
  }

  async function handleShareLink() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Sumate a mi Team en SoliProde",
          text: "Entran todos. Puntúan los mejores 11.",
          url: teamInviteUrl,
        });
        return;
      }

      await navigator.clipboard.writeText(teamInviteUrl);
      showFeedback("Link copiado");
    } catch {
      showFeedback("No pudimos compartir el link");
    }
  }

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(inviteCode);
      showFeedback("Código copiado");
    } catch {
      showFeedback("No pudimos copiar el código");
    }
  }

  return (
    <div className="teams-invite-actions">
      <a
        href={whatsappHref}
        target="_blank"
        rel="noreferrer"
        className="teams-button-primary"
      >
        Invitar por WhatsApp
      </a>
      <div className="teams-action-row">
        <button type="button" onClick={() => void handleShareLink()} className="teams-button-secondary">
          Compartir link
        </button>
        <button type="button" onClick={() => void handleCopyCode()} className="teams-button-secondary">
          Copiar código
        </button>
      </div>
      {feedback ? <p className="teams-inline-feedback">{feedback}</p> : null}
      <p className="teams-inline-meta">Código del Team: {inviteCode}</p>
    </div>
  );
}
