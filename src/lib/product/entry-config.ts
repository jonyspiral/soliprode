import { getOptionalEnv } from "@/lib/env";

const DEFAULT_ENTRY_PRICE = 6000;
const DEFAULT_PROMO_END_AT = "2026-06-11T16:00:00-03:00";

function resolveEntryPrice() {
  const rawValue = getOptionalEnv("NEXT_PUBLIC_ENTRY_PRICE");

  if (!rawValue) {
    return DEFAULT_ENTRY_PRICE;
  }

  const parsedValue = Number(rawValue);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return DEFAULT_ENTRY_PRICE;
  }

  return Math.round(parsedValue);
}

function resolveEntryPriceValidUntil() {
  return (
    getOptionalEnv("NEXT_PUBLIC_ENTRY_PRICE_VALID_UNTIL") ??
    getOptionalEnv("NEXT_PUBLIC_PROMO_END_AT") ??
    DEFAULT_PROMO_END_AT
  );
}

export const entryConfig = {
  initialPrice: resolveEntryPrice(),
  currency: "ARS",
  priceValidUntil: resolveEntryPriceValidUntil(),
} as const;

export function formatEntryPrice(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: entryConfig.currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getEntryCountdownParts(targetIso = entryConfig.priceValidUntil) {
  const diff = new Date(targetIso).getTime() - Date.now();

  if (diff <= 0) {
    return null;
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
  };
}

export function formatEntryCountdown(targetIso = entryConfig.priceValidUntil) {
  const parts = getEntryCountdownParts(targetIso);

  if (!parts) {
    return "Terminó la ventana inicial";
  }

  return `${parts.days}d ${parts.hours}h ${parts.minutes}m ${parts.seconds}s`;
}
