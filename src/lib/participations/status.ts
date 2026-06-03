const PENDING_REVIEW_STATUSES = new Set([
  "payment_started",
  "payment_pending",
  "manual_review",
]);

export type ParticipationUiState = {
  isPaid: boolean;
  isPendingReview: boolean;
  needsCompletion: boolean;
  statusLabel: string;
  supportText: string;
  shellBannerText: string;
};

export function resolveParticipationUiState(paymentStatus: string | null | undefined): ParticipationUiState {
  if (paymentStatus === "paid") {
    return {
      isPaid: true,
      isPendingReview: false,
      needsCompletion: false,
      statusLabel: "Compitiendo",
      supportText: "Tus pronósticos ya compiten en el ranking.",
      shellBannerText: "Ya estás compitiendo",
    };
  }

  if (paymentStatus && PENDING_REVIEW_STATUSES.has(paymentStatus)) {
    return {
      isPaid: false,
      isPendingReview: true,
      needsCompletion: false,
      statusLabel: "Estamos verificando tu inscripción",
      supportText: "Tus pronósticos quedan guardados.",
      shellBannerText: "Estamos verificando tu inscripción",
    };
  }

  return {
    isPaid: false,
    isPendingReview: false,
    needsCompletion: true,
    statusLabel: "Tus pronósticos todavía no compiten",
    supportText: "Tus pronósticos quedan guardados.",
    shellBannerText: "Tus pronósticos todavía no compiten",
  };
}
