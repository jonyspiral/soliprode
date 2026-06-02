type ParticipationLike = {
  created_at: string | null;
};

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

  return {
    hasMultiple: rows.length > 1,
    participation: rows[0] ?? null,
  };
}
