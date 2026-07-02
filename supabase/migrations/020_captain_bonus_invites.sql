-- SoliProde captain bonus invites
-- Scope: admin-granted captain bonus acquisition flow without touching normal payments.

alter table public.participations
  add column if not exists payment_source text,
  add column if not exists prize_eligible boolean not null default false,
  add column if not exists captain_bonus_completed_at timestamptz,
  add column if not exists captain_bonus_invite_id uuid;

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
      'granted',
      'rejected',
      'expired',
      'manual_review',
      'failed',
      'refunded'
    )
  );

create table if not exists public.captain_bonus_invites (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  invited_name text,
  invited_phone text,
  status text not null default 'pending',
  created_by_profile_id uuid references public.profiles (id) on delete set null,
  claimed_by_profile_id uuid references public.profiles (id) on delete set null,
  claimed_participation_id uuid references public.participations (id) on delete set null,
  claimed_group_id uuid references public.groups (id) on delete set null,
  deadline timestamptz not null,
  required_members integer not null default 5,
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  expired_at timestamptz,
  revoked_at timestamptz,
  notes text,
  constraint captain_bonus_invites_status_check check (
    status in ('pending', 'claimed', 'expired', 'revoked')
  ),
  constraint captain_bonus_invites_required_members_check check (required_members >= 2),
  constraint captain_bonus_invites_claim_state_check check (
    (
      status = 'pending'
      and claimed_by_profile_id is null
      and claimed_participation_id is null
      and claimed_at is null
      and expired_at is null
      and revoked_at is null
    )
    or (
      status = 'claimed'
      and claimed_by_profile_id is not null
      and claimed_participation_id is not null
      and claimed_at is not null
      and expired_at is null
      and revoked_at is null
    )
    or (
      status = 'expired'
      and claimed_by_profile_id is null
      and claimed_participation_id is null
      and claimed_at is null
      and expired_at is not null
      and revoked_at is null
    )
    or (
      status = 'revoked'
      and claimed_by_profile_id is null
      and claimed_participation_id is null
      and claimed_at is null
      and expired_at is null
      and revoked_at is not null
    )
  )
);

create index if not exists captain_bonus_invites_status_idx
  on public.captain_bonus_invites (status);
create index if not exists captain_bonus_invites_created_by_profile_id_idx
  on public.captain_bonus_invites (created_by_profile_id);
create index if not exists captain_bonus_invites_claimed_by_profile_id_idx
  on public.captain_bonus_invites (claimed_by_profile_id);
create index if not exists captain_bonus_invites_claimed_participation_id_idx
  on public.captain_bonus_invites (claimed_participation_id);
create index if not exists captain_bonus_invites_claimed_group_id_idx
  on public.captain_bonus_invites (claimed_group_id);
create unique index if not exists captain_bonus_invites_claimed_by_profile_id_unique
  on public.captain_bonus_invites (claimed_by_profile_id)
  where claimed_by_profile_id is not null;
create unique index if not exists captain_bonus_invites_claimed_participation_id_unique
  on public.captain_bonus_invites (claimed_participation_id)
  where claimed_participation_id is not null;
create unique index if not exists participations_captain_bonus_invite_id_unique
  on public.participations (captain_bonus_invite_id)
  where captain_bonus_invite_id is not null;

alter table public.participations
  drop constraint if exists participations_captain_bonus_invite_id_fkey;

alter table public.participations
  add constraint participations_captain_bonus_invite_id_fkey
  foreign key (captain_bonus_invite_id)
  references public.captain_bonus_invites (id)
  on delete set null;

alter table public.captain_bonus_invites enable row level security;

revoke all on table public.captain_bonus_invites from authenticated;
revoke all on table public.captain_bonus_invites from service_role;
grant select, insert, update, delete on table public.captain_bonus_invites to service_role;

create or replace function public.claim_captain_bonus_invite(
  p_code text,
  p_profile_id uuid,
  p_participation_id uuid,
  p_now timestamptz default now()
)
returns table (
  result_code text,
  invite_id uuid,
  participation_id uuid,
  group_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.captain_bonus_invites%rowtype;
  v_participation public.participations%rowtype;
  v_existing_grant uuid;
begin
  select *
  into v_invite
  from public.captain_bonus_invites
  where code = p_code
  for update;

  if not found then
    return query
    select 'captain_bonus_not_found'::text, null::uuid, null::uuid, null::uuid;
    return;
  end if;

  if v_invite.status = 'revoked' then
    return query
    select 'captain_bonus_revoked'::text, v_invite.id, null::uuid, null::uuid;
    return;
  end if;

  if v_invite.status = 'claimed' then
    return query
    select 'captain_bonus_claimed'::text, v_invite.id, v_invite.claimed_participation_id, v_invite.claimed_group_id;
    return;
  end if;

  if v_invite.status = 'expired' then
    return query
    select 'captain_bonus_expired'::text, v_invite.id, null::uuid, null::uuid;
    return;
  end if;

  if v_invite.deadline <= p_now then
    update public.captain_bonus_invites
    set status = 'expired',
        expired_at = p_now
    where id = v_invite.id;

    return query
    select 'captain_bonus_expired'::text, v_invite.id, null::uuid, null::uuid;
    return;
  end if;

  select id
  into v_existing_grant
  from public.captain_bonus_invites
  where claimed_by_profile_id = p_profile_id
    and status = 'claimed'
    and id <> v_invite.id
  limit 1;

  if v_existing_grant is not null then
    return query
    select 'captain_bonus_already_active'::text, v_invite.id, null::uuid, null::uuid;
    return;
  end if;

  if exists (
    select 1
    from public.participations
    where profile_id = p_profile_id
      and payment_status = 'paid'
  ) then
    return query
    select 'already_paid'::text, v_invite.id, null::uuid, null::uuid;
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
    select 'missing_participation'::text, v_invite.id, null::uuid, null::uuid;
    return;
  end if;

  if v_participation.payment_status = 'paid' then
    return query
    select 'already_paid'::text, v_invite.id, v_participation.id, v_participation.group_id;
    return;
  end if;

  if v_participation.payment_status = 'granted'
     and coalesce(v_participation.payment_source, '') = 'captain_bonus' then
    return query
    select 'captain_bonus_already_active'::text, v_invite.id, v_participation.id, v_participation.group_id;
    return;
  end if;

  update public.participations
  set payment_status = 'granted',
      payment_provider = 'captain_bonus',
      payment_source = 'captain_bonus',
      captain_bonus_invite_id = v_invite.id,
      prize_eligible = false,
      captain_bonus_completed_at = null,
      activated_at = coalesce(activated_at, p_now),
      eligible_from = coalesce(eligible_from, p_now)
  where id = v_participation.id;

  update public.captain_bonus_invites
  set claimed_by_profile_id = p_profile_id,
      claimed_participation_id = v_participation.id,
      claimed_group_id = v_participation.group_id,
      status = 'claimed',
      claimed_at = p_now
  where id = v_invite.id;

  return query
  select 'claimed'::text, v_invite.id, v_participation.id, v_participation.group_id;
end;
$$;

revoke all on function public.claim_captain_bonus_invite(text, uuid, uuid, timestamptz) from public;
revoke all on function public.claim_captain_bonus_invite(text, uuid, uuid, timestamptz) from authenticated;
grant execute on function public.claim_captain_bonus_invite(text, uuid, uuid, timestamptz) to service_role;
