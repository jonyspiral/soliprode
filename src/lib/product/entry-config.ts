export const entryConfig = {
  initialPrice: 6000,
  currency: "ARS",
  priceValidUntil: "2026-06-20T23:59:00-03:00",
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
