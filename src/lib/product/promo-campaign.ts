import { getOptionalEnv } from "@/lib/env";

const DEFAULT_PROMO_END_AT = "2026-06-06T23:59:59-03:00";

export const PROMO_END_AT =
  getOptionalEnv("NEXT_PUBLIC_PROMO_END_AT") ?? DEFAULT_PROMO_END_AT;

function padTime(value: number) {
  return String(value).padStart(2, "0");
}

export function getPromoCountdownParts(targetIso = PROMO_END_AT) {
  const diff = new Date(targetIso).getTime() - Date.now();

  if (diff <= 0) {
    return null;
  }

  const totalSeconds = Math.floor(diff / 1000);
  const totalHours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    totalHours,
    minutes,
    seconds,
  };
}

export function formatPromoCountdown(targetIso = PROMO_END_AT) {
  const parts = getPromoCountdownParts(targetIso);

  if (!parts) {
    return null;
  }

  return `${parts.totalHours}h ${padTime(parts.minutes)}m ${padTime(parts.seconds)}s`;
}
