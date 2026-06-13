-- SoliProde prepaid team passes
-- Scope: prepaid team slots + invite claims without bots or automatic players.

alter table public.payment_attempts
  add column if not exists checkout_kind text not null default 'individual_pass',
  add column if not exists team_slots_quantity integer not null default 1,
  add column if not exists target_group_id uuid references public.groups (id) on delete set null;

alter table public.payment_attempts
  drop constraint if exists payment_attempts_checkout_kind_check;

alter table public.payment_attempts
  add constraint payment_attempts_checkout_kind_check check (
    checkout_kind in ('individual_pass', 'team_pass')
  );

alter table public.payment_attempts
  drop constraint if exists payment_attempts_team_slots_quantity_check;

alter table public.payment_attempts
  add constraint payment_attempts_team_slots_quantity_check check (
    team_slots_quantity >= 1
  );

create table if not exists public.team_passes (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.groups (id) on delete cascade,
  purchased_by_profile_id uuid not null references public.profiles (id) on delete cascade,
  payment_attempt_id uuid not null unique references public.payment_attempts (id) on delete cascade,
  total_slots integer not null,
  used_slots integer not null default 0,
  status text not null default 'paid',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint team_passes_total_slots_check check (total_slots >= 1),
  constraint team_passes_used_slots_check check (used_slots >= 0 and used_slots <= total_slots),
  constraint team_passes_status_check check (status in ('pending', 'paid', 'partially_claimed', 'claimed', 'expired', 'cancelled'))
);

create index if not exists team_passes_team_id_idx
  on public.team_passes (team_id);
create index if not exists team_passes_purchased_by_profile_id_idx
  on public.team_passes (purchased_by_profile_id);
create index if not exists team_passes_status_idx
  on public.team_passes (status);

drop trigger if exists set_team_passes_updated_at on public.team_passes;
create trigger set_team_passes_updated_at
before update on public.team_passes
for each row
execute function public.set_updated_at();

create table if not exists public.team_invites (
  id uuid primary key default gen_random_uuid(),
  team_pass_id uuid not null references public.team_passes (id) on delete cascade,
  team_id uuid not null references public.groups (id) on delete cascade,
  code text not null unique,
  purchased_by_profile_id uuid not null references public.profiles (id) on delete cascade,
  claimed_by_profile_id uuid references public.profiles (id) on delete set null,
  claimed_participation_id uuid references public.participations (id) on delete set null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  expires_at timestamptz,
  constraint team_invites_status_check check (status in ('pending', 'claimed', 'expired'))
);

create index if not exists team_invites_team_pass_id_idx
  on public.team_invites (team_pass_id);
create index if not exists team_invites_team_id_idx
  on public.team_invites (team_id);
create index if not exists team_invites_status_idx
  on public.team_invites (status);
create index if not exists team_invites_purchased_by_profile_id_idx
  on public.team_invites (purchased_by_profile_id);
create index if not exists team_invites_claimed_by_profile_id_idx
  on public.team_invites (claimed_by_profile_id);
create unique index if not exists team_invites_claimed_by_profile_id_unique
  on public.team_invites (claimed_by_profile_id)
  where claimed_by_profile_id is not null;
create unique index if not exists team_invites_claimed_participation_id_unique
  on public.team_invites (claimed_participation_id)
  where claimed_participation_id is not null;

alter table public.team_passes enable row level security;
alter table public.team_invites enable row level security;

drop policy if exists "authenticated users can read own team passes"
  on public.team_passes;
create policy "authenticated users can read own team passes"
on public.team_passes
for select
to authenticated
using (auth.uid() = purchased_by_profile_id);

drop policy if exists "authenticated users can read own or claimed team invites"
  on public.team_invites;
create policy "authenticated users can read own or claimed team invites"
on public.team_invites
for select
to authenticated
using (
  auth.uid() = purchased_by_profile_id
  or auth.uid() = claimed_by_profile_id
);

revoke all on table public.team_passes from authenticated;
revoke all on table public.team_invites from authenticated;
grant select on table public.team_passes to authenticated;
grant select on table public.team_invites to authenticated;

revoke all on table public.team_passes from service_role;
revoke all on table public.team_invites from service_role;
grant select, insert, update, delete on table public.team_passes to service_role;
grant select, insert, update, delete on table public.team_invites to service_role;
