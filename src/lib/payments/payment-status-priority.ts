export type PaymentAttemptStatus =
  | "created"
  | "payment_started"
  | "payment_pending"
  | "paid"
  | "rejected"
  | "expired"
  | "manual_review"
  | "failed";

const TERMINAL_ATTEMPT_STATUS_PRIORITY: Record<string, number> = {
  paid: 100,
  rejected: 80,
  expired: 70,
  failed: 60,
  manual_review: 40,
  payment_pending: 30,
  payment_started: 20,
  created: 10,
};

export function mapMercadoPagoStatusToAttemptStatus(status: string | null | undefined): PaymentAttemptStatus {
  switch (status) {
    case "approved":
      return "paid";
    case "in_process":
    case "pending":
      return "payment_pending";
    case "rejected":
    case "cancelled":
    case "charged_back":
      return "rejected";
    default:
      return "manual_review";
  }
}

export function shouldPreserveManualPaidAttempt(input: {
  currentAttemptStatus: string;
  currentParticipationStatus: string | null | undefined;
  nextAttemptStatus: string;
}) {
  return (
    input.currentParticipationStatus === "paid" &&
    input.currentAttemptStatus === "paid" &&
    input.nextAttemptStatus !== "paid"
  );
}

export function isDowngradeFromPaidAttempt(input: {
  currentAttemptStatus: string;
  nextAttemptStatus: string;
}) {
  return (
    TERMINAL_ATTEMPT_STATUS_PRIORITY[input.currentAttemptStatus] === TERMINAL_ATTEMPT_STATUS_PRIORITY.paid &&
    TERMINAL_ATTEMPT_STATUS_PRIORITY[input.nextAttemptStatus] < TERMINAL_ATTEMPT_STATUS_PRIORITY.paid
  );
}
