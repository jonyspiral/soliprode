alter table public.participations
  add column if not exists rules_accepted_at timestamptz,
  add column if not exists rules_version text,
  add column if not exists is_adult_confirmed boolean not null default false;
