-- SoliProde captain bonus campaigns
-- Scope: shared admin campaigns with slot-based claims for captain bonus.

create table if not exists public.captain_bonus_campaigns (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  total_slots integer not null,
  claimed_slots integer not null default 0,
  status text not null default 'active',
  created_by_profile_id uuid references public.profiles (id) on delete set null,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  cancelled_at timestamptz,
  notes text,
  constraint captain_bonus_campaigns_name_check check (char_length(trim(name)) >= 3),
  constraint captain_bonus_campaigns_total_slots_check check (total_slots >= 1),
  constraint captain_bonus_campaigns_claimed_slots_check check (claimed_slots >= 0 and claimed_slots <= total_slots),
  constraint captain_bonus_campaigns_status_check check (status in ('active', 'exhausted', 'expired', 'cancelled')),
  constraint captain_bonus_campaigns_cancelled_state_check check (
    (status = 'cancelled' and cancelled_at is not null)
    or (status <> 'cancelled' and cancelled_at is null)
  )
);

create table if not exists public.captain_bonus_campaign_claims (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.captain_bonus_campaigns (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  participation_id uuid not null references public.participations (id) on delete cascade,
  group_id uuid references public.groups (id) on delete set null,
  claimed_at timestamptz not null default now(),
  constraint captain_bonus_campaign_claims_campaign_profile_unique unique (campaign_id, profile_id),
  constraint captain_bonus_campaign_claims_profile_unique unique (profile_id),
  constraint captain_bonus_campaign_claims_participation_unique unique (participation_id)
);

create index if not exists captain_bonus_campaigns_status_idx
  on public.captain_bonus_campaigns (status);
create index if not exists captain_bonus_campaigns_created_by_profile_id_idx
  on public.captain_bonus_campaigns (created_by_profile_id);
create index if not exists captain_bonus_campaign_claims_campaign_id_idx
  on public.captain_bonus_campaign_claims (campaign_id);
create index if not exists captain_bonus_campaign_claims_group_id_idx
  on public.captain_bonus_campaign_claims (group_id);
create index if not exists captain_bonus_campaign_claims_claimed_at_idx
  on public.captain_bonus_campaign_claims (claimed_at desc);

alter table public.captain_bonus_campaigns enable row level security;
alter table public.captain_bonus_campaign_claims enable row level security;

revoke all on table public.captain_bonus_campaigns from authenticated;
revoke all on table public.captain_bonus_campaign_claims from authenticated;
revoke all on table public.captain_bonus_campaigns from service_role;
revoke all on table public.captain_bonus_campaign_claims from service_role;
grant select, insert, update, delete on table public.captain_bonus_campaigns to service_role;
grant select, insert, update, delete on table public.captain_bonus_campaign_claims to service_role;

create or replace function public.claim_captain_bonus_campaign(
  p_code text,
  p_profile_id uuid,
  p_participation_id uuid,
  p_now timestamptz default now()
)
returns table (
  result_code text,
  campaign_id uuid,
  participation_id uuid,
  group_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_campaign public.captain_bonus_campaigns%rowtype;
  v_participation public.participations%rowtype;
  v_claim public.captain_bonus_campaign_claims%rowtype;
  v_next_claimed_slots integer;
begin
  select *
  into v_campaign
  from public.captain_bonus_campaigns
  where code = p_code
  for update;

  if not found then
    return query
    select 'captain_bonus_not_found'::text, null::uuid, null::uuid, null::uuid;
    return;
  end if;

  if v_campaign.status = 'cancelled' then
    return query
    select 'captain_bonus_cancelled'::text, v_campaign.id, null::uuid, null::uuid;
    return;
  end if;

  if v_campaign.status = 'expired' then
    return query
    select 'captain_bonus_expired'::text, v_campaign.id, null::uuid, null::uuid;
    return;
  end if;

  if v_campaign.expires_at is not null and v_campaign.expires_at <= p_now then
    update public.captain_bonus_campaigns
    set status = 'expired'
    where id = v_campaign.id;

    return query
    select 'captain_bonus_expired'::text, v_campaign.id, null::uuid, null::uuid;
    return;
  end if;

  if v_campaign.status = 'exhausted' or v_campaign.claimed_slots >= v_campaign.total_slots then
    update public.captain_bonus_campaigns
    set status = 'exhausted',
        claimed_slots = greatest(claimed_slots, total_slots)
    where id = v_campaign.id;

    return query
    select 'captain_bonus_exhausted'::text, v_campaign.id, null::uuid, null::uuid;
    return;
  end if;

  select *
  into v_claim
  from public.captain_bonus_campaign_claims
  where profile_id = p_profile_id
  limit 1;

  if found then
    return query
    select 'captain_bonus_already_active'::text, v_claim.campaign_id, v_claim.participation_id, v_claim.group_id;
    return;
  end if;

  if exists (
    select 1
    from public.participations
    where profile_id = p_profile_id
      and payment_status = 'paid'
  ) then
    return query
    select 'already_paid'::text, v_campaign.id, null::uuid, null::uuid;
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
    select 'missing_participation'::text, v_campaign.id, null::uuid, null::uuid;
    return;
  end if;

  if v_participation.payment_status = 'paid' then
    return query
    select 'already_paid'::text, v_campaign.id, v_participation.id, v_participation.group_id;
    return;
  end if;

  if v_participation.payment_status = 'granted'
     and coalesce(v_participation.payment_source, '') = 'captain_bonus' then
    return query
    select 'captain_bonus_already_active'::text, v_campaign.id, v_participation.id, v_participation.group_id;
    return;
  end if;

  insert into public.captain_bonus_campaign_claims (
    campaign_id,
    profile_id,
    participation_id,
    group_id,
    claimed_at
  )
  values (
    v_campaign.id,
    p_profile_id,
    v_participation.id,
    v_participation.group_id,
    p_now
  );

  update public.participations
  set payment_status = 'granted',
      payment_provider = 'captain_bonus',
      payment_source = 'captain_bonus',
      prize_eligible = false,
      captain_bonus_completed_at = null,
      activated_at = coalesce(activated_at, p_now),
      eligible_from = coalesce(eligible_from, p_now)
  where id = v_participation.id;

  v_next_claimed_slots := v_campaign.claimed_slots + 1;

  update public.captain_bonus_campaigns
  set claimed_slots = v_next_claimed_slots,
      status = case
        when v_next_claimed_slots >= total_slots then 'exhausted'
        else 'active'
      end
  where id = v_campaign.id;

  return query
  select
    'claimed'::text,
    v_campaign.id,
    v_participation.id,
    v_participation.group_id;
end;
$$;

revoke all on function public.claim_captain_bonus_campaign(text, uuid, uuid, timestamptz) from public;
revoke all on function public.claim_captain_bonus_campaign(text, uuid, uuid, timestamptz) from authenticated;
grant execute on function public.claim_captain_bonus_campaign(text, uuid, uuid, timestamptz) to service_role;
