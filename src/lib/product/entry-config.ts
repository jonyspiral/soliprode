export const entryConfig = {
  initialPrice: 5000,
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
