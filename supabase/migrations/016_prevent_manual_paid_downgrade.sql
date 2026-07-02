-- SoliProde manual payment downgrade guard
-- Scope: protect manually confirmed paid records from stale provider events.

create or replace function public.preserve_manual_paid_participation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.payment_status = 'paid'
    and old.payment_provider = 'manual'
    and new.payment_status <> 'paid'
  then
    new.payment_status := old.payment_status;
    new.payment_provider := old.payment_provider;
    new.paid_at := old.paid_at;
    new.activated_at := old.activated_at;
    new.eligible_from := old.eligible_from;
  end if;

  return new;
end;
$$;

drop trigger if exists preserve_manual_paid_participation on public.participations;
create trigger preserve_manual_paid_participation
before update on public.participations
for each row
execute function public.preserve_manual_paid_participation();

create or replace function public.preserve_manual_paid_payment_attempt()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_attempted_status text;
begin
  if old.status = 'paid'
    and old.raw_provider_response ? 'manual_confirmation'
    and new.status <> 'paid'
  then
    v_attempted_status := new.status;
    new.status := old.status;
    new.approved_at := old.approved_at;
    new.raw_provider_response := old.raw_provider_response
      || jsonb_build_object(
        'ignored_stale_provider_update', jsonb_build_object(
          'ignored_at', now(),
          'attempted_status', v_attempted_status,
          'reason', 'manual_confirmation_has_priority'
        )
      );
  end if;

  return new;
end;
$$;

drop trigger if exists preserve_manual_paid_payment_attempt on public.payment_attempts;
create trigger preserve_manual_paid_payment_attempt
before update on public.payment_attempts
for each row
execute function public.preserve_manual_paid_payment_attempt();
