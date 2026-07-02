-- SoliProde prepaid team pass hardening delta
-- Apply this after 018 when that migration was already executed in a live database.

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
