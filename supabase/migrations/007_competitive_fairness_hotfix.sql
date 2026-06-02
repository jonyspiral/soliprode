-- SoliProde competitive fairness hotfix
-- Scope: eligibility timestamps + provider approval persistence only.

alter table public.participations
  add column if not exists payment_started_at timestamptz,
  add column if not exists payment_submitted_at timestamptz;

alter table public.payment_attempts
  add column if not exists approved_at timestamptz;
