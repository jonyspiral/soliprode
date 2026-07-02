type ParticipationLike = {
  created_at: string | null;
  payment_status?: string | null;
};

const PAYMENT_STATUS_PRIORITY: Record<string, number> = {
  paid: 0,
  granted: 1,
  payment_pending: 2,
  payment_started: 3,
  manual_review: 4,
  pending: 5,
};

function getPaymentStatusPriority(paymentStatus: string | null | undefined) {
  return paymentStatus ? PAYMENT_STATUS_PRIORITY[paymentStatus] ?? 99 : 99;
}

function getCreatedAtTime(createdAt: string | null) {
  const time = createdAt ? Date.parse(createdAt) : 0;
  return Number.isFinite(time) ? time : 0;
}

export function pickPrimaryParticipation<T extends ParticipationLike>(
  rows: T[] | null | undefined,
): {
  hasMultiple: boolean;
  participation: T | null;
} {
  if (!rows || rows.length === 0) {
    return {
      hasMultiple: false,
      participation: null,
    };
  }

  const [participation] = [...rows].sort((left, right) => {
    const priorityDelta =
      getPaymentStatusPriority(left.payment_status) - getPaymentStatusPriority(right.payment_status);

    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    return getCreatedAtTime(right.created_at) - getCreatedAtTime(left.created_at);
  });

  return {
    hasMultiple: rows.length > 1,
    participation: participation ?? null,
  };
}
