import { getOptionalEnv } from "@/lib/env";
import { normalizePromoterCode } from "@/lib/auth/promoter-attribution";

const DEFAULT_CAPTAIN_BONUS_DEADLINE = "2026-07-04T23:59:59-03:00";
const DEFAULT_CAPTAIN_BONUS_REQUIRED_MEMBERS = 5;

function resolveCaptainBonusDeadlineAt() {
  return (
    getOptionalEnv("NEXT_PUBLIC_CAPTAIN_BONUS_DEADLINE") ??
    getOptionalEnv("CAPTAIN_BONUS_DEADLINE") ??
    DEFAULT_CAPTAIN_BONUS_DEADLINE
  );
}

function resolveCaptainBonusRequiredMembers() {
  const rawValue =
    getOptionalEnv("NEXT_PUBLIC_CAPTAIN_BONUS_REQUIRED_MEMBERS") ??
    getOptionalEnv("CAPTAIN_BONUS_REQUIRED_MEMBERS");

  if (!rawValue) {
    return DEFAULT_CAPTAIN_BONUS_REQUIRED_MEMBERS;
  }

  const parsedValue = Number(rawValue);

  if (!Number.isFinite(parsedValue) || parsedValue < 2) {
    return DEFAULT_CAPTAIN_BONUS_REQUIRED_MEMBERS;
  }

  return Math.round(parsedValue);
}

export const captainBonusConfig = {
  deadlineAt: resolveCaptainBonusDeadlineAt(),
  requiredMembers: resolveCaptainBonusRequiredMembers(),
} as const;

export function formatCaptainBonusDeadline(targetIso = captainBonusConfig.deadlineAt) {
  const date = new Date(targetIso);

  if (!Number.isFinite(date.getTime())) {
    return "4 de julio de 2026";
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(date);
}

export function resolveCaptainBonusStatus(params: {
  activeMembers: number;
  deadlineAt?: string | null;
  now?: number;
  requiredMembers?: number;
}) {
  const requiredMembers = params.requiredMembers ?? captainBonusConfig.requiredMembers;
  const missingMembers = Math.max(0, requiredMembers - params.activeMembers);
  const deadlineAt = params.deadlineAt ?? captainBonusConfig.deadlineAt;
  const deadlineMs = new Date(deadlineAt).getTime();
  const now = params.now ?? Date.now();

  if (missingMembers <= 0) {
    return {
      status: "completed" as const,
      missingMembers,
      requiredMembers,
    };
  }

  if (Number.isFinite(deadlineMs) && now > deadlineMs) {
    return {
      status: "expired" as const,
      missingMembers,
      requiredMembers,
    };
  }

  return {
    status: "pending" as const,
    missingMembers,
    requiredMembers,
  };
}

export function isCaptainBonusParticipationStatus(paymentStatus: string | null | undefined) {
  return paymentStatus === "granted";
}

export function countsForCaptainBonusProgress(paymentStatus: string | null | undefined) {
  return paymentStatus === "paid" || paymentStatus === "granted";
}

export function buildCaptainBonusLink(baseUrl: string, promoterCode?: string | null) {
  const normalizedPromoterCode = normalizePromoterCode(promoterCode);
  const href = normalizedPromoterCode
    ? `/entrar?p=${encodeURIComponent(normalizedPromoterCode)}`
    : "/activar-pase";
  return new URL(href, baseUrl).toString();
}

export function buildCaptainBonusCampaignLink(baseUrl: string, code: string) {
  return new URL(`/groups/captain-bonus?code=${encodeURIComponent(code)}`, baseUrl).toString();
}

export function buildCaptainBonusInviteLink(baseUrl: string, code: string) {
  return buildCaptainBonusCampaignLink(baseUrl, code);
}

export function buildCaptainBonusTeamInviteLink(baseUrl: string, inviteCode: string) {
  return new URL(`/groups?code=${encodeURIComponent(inviteCode)}`, baseUrl).toString();
}

export function buildCaptainBonusCampaignMessage(input: {
  claimUrl: string;
}) {
  return [
    "Te invito a ser Capitán Bonificado en SoliProde.",
    "",
    "Entrá desde este link, reclamá tu pase de capitán y armá tu Team para competir con tus amigos:",
    "",
    input.claimUrl,
    "",
    "El pase de capitán queda bonificado. Después invitás a tu equipo y empiezan a sumar con sus pronósticos.",
    "",
    "Cupos limitados.",
  ].join("\n");
}

export function buildCaptainBonusCaptainMessage(input: {
  captainBonusLink: string;
  deadlineLabel?: string;
  missingMembers: number;
  name: string;
  prizePoolLabel: string;
}) {
  const deadlineLabel = input.deadlineLabel ?? formatCaptainBonusDeadline();

  return [
    `Hola ${input.name}, te invitamos a jugar el Prode Mundial con Pase Capitán Bonificado.`,
    "",
    `Te damos el pase para que armes tu Team. Para participar por premios, necesitás sumar ${input.missingMembers} jugador${input.missingMembers === 1 ? "" : "es"} más antes del ${deadlineLabel}.`,
    "",
    `Hay más de ${input.prizePoolLabel} en premios y además ayudás a financiar una tesis universitaria.`,
    "",
    "Activá tu pase acá:",
    input.captainBonusLink,
  ].join("\n");
}

export function buildCaptainBonusTeamMessage(input: {
  deadlineLabel?: string;
  prizePoolLabel: string;
  teamInviteLink: string;
}) {
  const deadlineLabel = input.deadlineLabel ?? formatCaptainBonusDeadline();

  return [
    "Te invito a jugar el Prode Mundial en mi Team.",
    "",
    `Estamos compitiendo por más de ${input.prizePoolLabel} en premios y ayudando a financiar una tesis universitaria.`,
    "",
    "Entrá con este link, activá tu pase y empezá a sumar puntos para el equipo:",
    input.teamInviteLink,
    "",
    `Tenemos tiempo hasta el ${deadlineLabel} para completar el Team. Mientras antes entres, más chances tenemos.`,
  ].join("\n");
}
