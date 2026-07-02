"use client";

import { useMemo, useState } from "react";
import { buildCaptainBonusTeamMessage, formatCaptainBonusDeadline } from "@/lib/product/captain-bonus";
import { resolvePublicSiteOrigin } from "@/lib/site-url";

type TeamInviteActionsProps = {
  inviteCode: string;
  prizePoolLabel: string;
  teamName?: string | null;
  variant?: "default" | "captain-bonus";
};

function buildDefaultTeamInviteMessage(teamInviteUrl: string, prizePoolLabel: string) {
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

export function TeamInviteActions({
  inviteCode,
  prizePoolLabel,
  teamName,
  variant = "default",
}: TeamInviteActionsProps) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const teamInviteUrl = useMemo(() => {
    const baseUrl = resolveBaseUrl();
    return `${baseUrl}/groups?code=${inviteCode}`;
  }, [inviteCode]);
  const whatsappMessage = useMemo(
    () =>
      variant === "captain-bonus"
        ? buildCaptainBonusTeamMessage({
            deadlineLabel: formatCaptainBonusDeadline(),
            prizePoolLabel,
            teamInviteLink: teamInviteUrl,
          })
        : buildDefaultTeamInviteMessage(teamInviteUrl, prizePoolLabel),
    [prizePoolLabel, teamInviteUrl, variant],
  );
  const whatsappHref = useMemo(
    () => `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`,
    [whatsappMessage],
  );

  function showFeedback(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), 1800);
  }

  async function handleInvitePlayer() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: teamName ? `SoliProde · ${teamName}` : "SoliProde",
          text: whatsappMessage,
          url: teamInviteUrl,
        });
        showFeedback("Invitación lista");
        return;
      }

      await navigator.clipboard.writeText(whatsappMessage);
      showFeedback("Mensaje copiado");
    } catch {
      showFeedback("No pudimos compartir el link");
    }
  }

  async function handleCopyInvite() {
    try {
      await navigator.clipboard.writeText(whatsappMessage);
      showFeedback("Invitación copiada");
    } catch {
      showFeedback("No pudimos copiar la invitación");
    }
  }

  return (
    <div className="teams-invite-actions">
      <div className="teams-action-row">
        <button type="button" onClick={() => void handleCopyInvite()} className="teams-button-secondary">
          Copiar invitación
        </button>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="teams-button-primary"
          onClick={() => showFeedback("Abriendo WhatsApp")}
        >
          Invitar jugador
        </a>
        <button type="button" onClick={() => void handleInvitePlayer()} className="teams-button-secondary">
          Compartir link
        </button>
      </div>
      {feedback ? <p className="teams-inline-feedback">{feedback}</p> : null}
      <p className="teams-inline-meta">{teamName ? `${teamName} · ` : ""}Código del Team: {inviteCode}</p>
    </div>
  );
}
