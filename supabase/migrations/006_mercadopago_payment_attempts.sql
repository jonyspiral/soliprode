-- SoliProde Mercado Pago sandbox foundation
-- Scope: payment attempts + participation payment metadata only.
-- No scoring, rankings, groups or auth changes are included here.

alter table public.participations
  add column if not exists entry_price numeric,
  add column if not exists price_snapshot_at timestamptz,
  add column if not exists price_valid_until timestamptz,
  add column if not exists payment_provider text,
  add column if not exists activated_at timestamptz,
  add column if not exists eligible_from timestamptz,
  add column if not exists entry_baseline_points integer not null default 0;

alter table public.participations
  drop constraint if exists participations_payment_status_check;

alter table public.participations
  add constraint participations_payment_status_check check (
    payment_status in (
      'pending',
      'draft_predictions',
      'payment_started',
      'payment_pending',
      'paid',
      'rejected',
      'expired',
      'manual_review',
      'failed',
      'refunded'
    )
  );

create table if not exists public.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  participation_id uuid not null references public.participations (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null default 'mercadopago',
  provider_preference_id text,
  provider_payment_id text,
  external_reference text not null unique,
  amount numeric not null,
  currency text not null default 'ARS',
  status text not null default 'created',
  checkout_url text,
  init_point text,
  sandbox_init_point text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz,
  raw_provider_response jsonb,
  constraint payment_attempts_status_check check (
    status in (
      'created',
      'payment_started',
      'payment_pending',
      'paid',
      'rejected',
      'expired',
      'manual_review',
      'failed'
    )
  )
);

create index if not exists payment_attempts_participation_id_idx
  on public.payment_attempts (participation_id);
create index if not exists payment_attempts_profile_id_idx
  on public.payment_attempts (profile_id);
create index if not exists payment_attempts_status_idx
  on public.payment_attempts (status);
create index if not exists payment_attempts_provider_payment_id_idx
  on public.payment_attempts (provider_payment_id);

drop trigger if exists set_payment_attempts_updated_at on public.payment_attempts;
create trigger set_payment_attempts_updated_at
before update on public.payment_attempts
for each row
execute function public.set_updated_at();

alter table public.payment_attempts enable row level security;

grant select on table public.payment_attempts to authenticated;

drop policy if exists "authenticated users can update own pending participations"
  on public.participations;
drop policy if exists "authenticated users can update own unpaid participations"
  on public.participations;
create policy "authenticated users can update own unpaid participations"
on public.participations
for update
to authenticated
using (
  auth.uid() = profile_id
  and payment_status in (
    'pending',
    'draft_predictions',
    'payment_started',
    'payment_pending',
    'manual_review',
    'rejected',
    'expired'
  )
)
with check (
  auth.uid() = profile_id
  and payment_status in (
    'pending',
    'draft_predictions',
    'payment_started',
    'payment_pending',
    'manual_review',
    'rejected',
    'expired'
  )
);

drop policy if exists "authenticated users can read own payment attempts"
  on public.payment_attempts;
create policy "authenticated users can read own payment attempts"
on public.payment_attempts
for select
to authenticated
using (auth.uid() = profile_id);
