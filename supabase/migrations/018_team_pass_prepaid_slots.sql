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

alter table public.team_invites
  drop constraint if exists team_invites_claim_state_check;

alter table public.team_invites
  add constraint team_invites_claim_state_check check (
    (
      status = 'pending'
      and claimed_by_profile_id is null
      and claimed_participation_id is null
      and claimed_at is null
    )
    or (
      status = 'claimed'
      and claimed_by_profile_id is not null
      and claimed_participation_id is not null
      and claimed_at is not null
    )
    or (
      status = 'expired'
      and claimed_by_profile_id is null
      and claimed_participation_id is null
      and claimed_at is null
    )
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
to aut   henticated
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

create or replace function public.claim_team_pass_invite(
  p_code text,
  p_profile_id uuid,
  p_participation_id uuid,
  p_now timestamptz default now()
)
returns table (
  result_code text,
  invite_id uuid,
  team_id uuid,
  participation_id uuid,
  team_pass_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.team_invites%rowtype;
  v_participation public.participations%rowtype;
  v_used_slots integer;
  v_total_slots integer;
  v_team_pass_status text;
  v_row_count integer;
begin
  select *
  into v_invite
  from public.team_invites
  where code = p_code
  for update;

  if not found then
    return query
    select 'team_invite_not_found'::text, null::uuid, null::uuid, null::uuid, null::uuid;
    return;
  end if;

  if v_invite.status <> 'pending' then
    return query
    select 'team_invite_unavailable'::text, v_invite.id, v_invite.team_id, null::uuid, v_invite.team_pass_id;
    return;
  end if;

  if v_invite.expires_at is not null and v_invite.expires_at <= p_now then
    update public.team_invites
    set status = 'expired',
        claimed_by_profile_id = null,
        claimed_participation_id = null,
        claimed_at = null
    where id = v_invite.id;

    return query
    select 'team_invite_expired'::text, v_invite.id, v_invite.team_id, null::uuid, v_invite.team_pass_id;
    return;
  end if;

  perform 1
  from public.team_passes
  where id = v_invite.team_pass_id
  for update;

  if exists (
    select 1
    from public.participations
    where profile_id = p_profile_id
      and payment_status = 'paid'
  ) then
    return query
    select 'already_paid'::text, v_invite.id, v_invite.team_id, null::uuid, v_invite.team_pass_id;
    return;
  end if;

  if exists (
    select 1
    from public.team_invites
    where claimed_by_profile_id = p_profile_id
      and id <> v_invite.id
  ) then
    return query
    select 'team_invite_incompatible'::text, v_invite.id, v_invite.team_id, null::uuid, v_invite.team_pass_id;
    return;
  end if;

  select *
  into v_participation
  from public.participations
  where id = p_participation_id
    and profile_id = p_profile_id
  for update;

  if not found then
    return query
    select 'missing_participation'::text, v_invite.id, v_invite.team_id, null::uuid, v_invite.team_pass_id;
    return;
  end if;

  if v_participation.payment_status = 'paid' then
    return query
    select 'already_paid'::text, v_invite.id, v_invite.team_id, v_participation.id, v_invite.team_pass_id;
    return;
  end if;

  if exists (
    select 1
    from public.team_invites
    where claimed_participation_id = v_participation.id
      and id <> v_invite.id
  ) then
    return query
    select 'team_invite_incompatible'::text, v_invite.id, v_invite.team_id, v_participation.id, v_invite.team_pass_id;
    return;
  end if;

  update public.team_invites
  set claimed_by_profile_id = p_profile_id,
      claimed_participation_id = v_participation.id,
      status = 'claimed',
      claimed_at = p_now
  where id = v_invite.id
    and status = 'pending';

  get diagnostics v_row_count = row_count;

  if v_row_count <> 1 then
    return query
    select 'team_invite_unavailable'::text, v_invite.id, v_invite.team_id, v_participation.id, v_invite.team_pass_id;
    return;
  end if;

  update public.participations
  set payment_status = 'paid',
      payment_provider = 'team_pass',
      group_id = v_invite.team_id,
      paid_at = p_now,
      activated_at = p_now,
      eligible_from = p_now,
      entry_price = 0,
      price_snapshot_at = p_now,
      price_valid_until = v_invite.expires_at,
      entry_baseline_points = 0
  where id = v_participation.id;

  select count(*)::integer
  into v_used_slots
  from public.team_invites
  where team_pass_id = v_invite.team_pass_id
    and status = 'claimed';

  select total_slots
  into v_total_slots
  from public.team_passes
  where id = v_invite.team_pass_id
  for update;

  v_team_pass_status :=
    case
      when coalesce(v_used_slots, 0) <= 0 then 'paid'
      when coalesce(v_used_slots, 0) >= coalesce(v_total_slots, 0) then 'claimed'
      else 'partially_claimed'
    end;

  update public.team_passes
  set used_slots = coalesce(v_used_slots, 0),
      status = v_team_pass_status
  where id = v_invite.team_pass_id;

  return query
  select 'claimed'::text, v_invite.id, v_invite.team_id, v_participation.id, v_invite.team_pass_id;
end;
$$;

revoke all on function public.claim_team_pass_invite(text, uuid, uuid, timestamptz) from public;
revoke all on function public.claim_team_pass_invite(text, uuid, uuid, timestamptz) from authenticated;
grant execute on function public.claim_team_pass_invite(text, uuid, uuid, timestamptz) to service_role;
