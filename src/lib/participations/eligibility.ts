type ManualEligibilityInput = {
  activated_at?: string | null;
  payment_started_at?: string | null;
  payment_submitted_at?: string | null;
};

type OnlineEligibilityInput = {
  activated_at?: string | null;
  approved_at?: string | null;
  paid_at?: string | null;
  payment_started_at?: string | null;
};

function pickFirstTimestamp(candidates: Array<string | null | undefined>) {
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }

  return null;
}

export function resolveManualEligibleFrom(
  input: ManualEligibilityInput,
  fallbackNow = new Date().toISOString(),
) {
  return (
    pickFirstTimestamp([
      input.payment_submitted_at,
      input.payment_started_at,
      input.activated_at,
    ]) ?? fallbackNow
  );
}

export function resolveOnlineEligibleFrom(
  input: OnlineEligibilityInput,
  fallbackNow = new Date().toISOString(),
) {
  return (
    pickFirstTimestamp([
      input.approved_at,
      input.payment_started_at,
      input.activated_at,
      input.paid_at,
    ]) ?? fallbackNow
  );
}
