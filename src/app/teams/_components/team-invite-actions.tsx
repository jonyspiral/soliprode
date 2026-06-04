"use client";

import { useMemo, useState } from "react";
import { resolvePublicSiteOrigin } from "@/lib/site-url";

type TeamInviteActionsProps = {
  inviteCode: string;
  prizePoolLabel: string;
};

function buildTeamInviteMessage(teamInviteUrl: string, prizePoolLabel: string) {
  return [
    "Te invito a participar del Prode Mundial, un prode solidario para ayudar a financiar una tesis universitaria.",
    "",
    "Competís por el pozo como Jugador y también podés armar un Team con tus mejores amigos para ir por la gloria como equipo.",
    "",
    `El pozo acumulado ya es de ${prizePoolLabel} y sigue creciendo.`,
    "",
    "Participá, ganá y ayudá.",
    "Llevá a tu grupo al campeonato.",
    "",
    "Si querés sumarte directo a nuestro Team, entrá desde acá:",
    teamInviteUrl,
  ].join("\n");
}

function resolveBaseUrl() {
  return resolvePublicSiteOrigin(
    typeof window !== "undefined" ? window.location.origin : null,
  ) ?? "";
}

export function TeamInviteActions({ inviteCode, prizePoolLabel }: TeamInviteActionsProps) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const teamInviteUrl = useMemo(() => {
    const baseUrl = resolveBaseUrl();
    return `${baseUrl}/groups?code=${inviteCode}`;
  }, [inviteCode]);
  const whatsappMessage = useMemo(
    () => buildTeamInviteMessage(teamInviteUrl, prizePoolLabel),
    [prizePoolLabel, teamInviteUrl],
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
          title: "SoliProde",
          text: whatsappMessage,
          url: teamInviteUrl,
        });
        return;
      }

      await navigator.clipboard.writeText(whatsappMessage);
      showFeedback("Mensaje copiado");
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
