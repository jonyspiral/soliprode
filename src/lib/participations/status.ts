const RETRYABLE_PAYMENT_STATUSES = new Set(["payment_started", "payment_pending"]);
const PENDING_REVIEW_STATUSES = new Set(["manual_review"]);

export type ParticipationUiState = {
  isPaid: boolean;
  isPendingReview: boolean;
  isRetryableCheckout: boolean;
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
      isRetryableCheckout: false,
      needsCompletion: false,
      statusLabel: "Jugador activo",
      supportText: "Pase Solidario confirmado. Tus pronósticos ya compiten en el ranking.",
      shellBannerText: "Aporte confirmado",
    };
  }

  if (paymentStatus && RETRYABLE_PAYMENT_STATUSES.has(paymentStatus)) {
    return {
      isPaid: false,
      isPendingReview: false,
      isRetryableCheckout: true,
      needsCompletion: true,
      statusLabel: "Registrado",
      supportText: "Tu activación no quedó confirmada todavía. Podés continuar o reintentar el checkout.",
      shellBannerText: "Completá tu Pase Solidario",
    };
  }

  if (paymentStatus && PENDING_REVIEW_STATUSES.has(paymentStatus)) {
    return {
      isPaid: false,
      isPendingReview: true,
      isRetryableCheckout: false,
      needsCompletion: false,
      statusLabel: "Registrado",
      supportText: "Tus pronósticos quedan guardados. Cuando se confirme tu Aporte, pasás a competir.",
      shellBannerText: "Pase Solidario en revisión",
    };
  }

  return {
    isPaid: false,
    isPendingReview: false,
    isRetryableCheckout: false,
    needsCompletion: true,
    statusLabel: "Registrado",
    supportText: "Debés terminar tu inscripción para competir.",
    shellBannerText: "Completá tu Pase Solidario",
  };
}
