-- SoliProde manual payment review RPCs
-- Scope: atomic admin confirmation/rejection for participations and payment attempts.

create or replace function public.confirm_manual_participation_payment(
  p_participation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin public.profiles%rowtype;
  v_participation public.participations%rowtype;
  v_now timestamptz := now();
  v_eligible_from timestamptz;
  v_attempt_count integer := 0;
  v_previous_status text;
begin
  select *
  into v_admin
  from public.profiles
  where id = auth.uid()
    and is_admin = true;

  if not found then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select *
  into v_participation
  from public.participations
  where id = p_participation_id
  for update;

  if not found then
    return jsonb_build_object(
      'ok', false,
      'code', 'participation_not_found',
      'message', 'No pudimos encontrar la participación.'
    );
  end if;

  v_previous_status := v_participation.payment_status;

  if v_participation.payment_status = 'paid' then
    return jsonb_build_object(
      'ok', true,
      'code', 'already_confirmed',
      'transitioned', false,
      'message', 'Pago ya confirmado. Participación habilitada.',
      'participation_id', v_participation.id,
      'previous_status', v_previous_status,
      'new_status', v_participation.payment_status
    );
  end if;

  if v_participation.payment_status not in (
    'pending',
    'draft_predictions',
    'payment_started',
    'payment_pending',
    'manual_review',
    'rejected'
  ) then
    return jsonb_build_object(
      'ok', false,
      'code', 'invalid_status',
      'message', 'No se puede confirmar una participación en estado ' || v_participation.payment_status || '.',
      'participation_id', v_participation.id,
      'previous_status', v_previous_status
    );
  end if;

  v_eligible_from := coalesce(
    v_participation.payment_submitted_at,
    v_participation.payment_started_at,
    v_now
  );

  select count(*)
  into v_attempt_count
  from public.payment_attempts
  where participation_id = v_participation.id
    and status in ('created', 'payment_started', 'payment_pending', 'manual_review', 'rejected');

  if v_attempt_count = 0 then
    insert into public.payment_attempts (
      participation_id,
      profile_id,
      provider,
      external_reference,
      amount,
      currency,
      status,
      approved_at,
      raw_provider_response
    )
    values (
      v_participation.id,
      v_participation.profile_id,
      'manual_admin',
      'soliprode:manual-confirmation:' || v_participation.id::text || ':' || gen_random_uuid()::text,
      coalesce(v_participation.entry_price, 0),
      'ARS',
      'paid',
      v_now,
      jsonb_build_object(
        'manual_confirmation', jsonb_build_object(
          'confirmed_at', v_now,
          'confirmed_by', v_admin.id,
          'confirmed_by_email', v_admin.email,
          'previous_status', v_previous_status,
          'new_status', 'paid',
          'source', 'admin',
          'provider', 'manual_admin',
          'original_mercadopago_attempt_id', null
        )
      )
    );
  else
    update public.payment_attempts
    set
      approved_at = coalesce(approved_at, v_now),
      status = 'paid',
      raw_provider_response = coalesce(raw_provider_response, '{}'::jsonb)
        || jsonb_build_object(
          'manual_confirmation', jsonb_build_object(
            'confirmed_at', v_now,
            'confirmed_by', v_admin.id,
            'confirmed_by_email', v_admin.email,
            'previous_attempt_status', status,
            'previous_status', v_previous_status,
            'new_status', 'paid',
            'source', 'admin',
            'provider', provider,
            'original_mercadopago_attempt_id',
              case when provider = 'mercadopago' then id else null end,
            'provider_preference_id', provider_preference_id,
            'provider_payment_id', provider_payment_id,
            'external_reference', external_reference
          )
        )
    where participation_id = v_participation.id
      and status in ('created', 'payment_started', 'payment_pending', 'manual_review', 'rejected');
  end if;

  update public.participations
  set
    payment_status = 'paid',
    payment_provider = 'manual',
    paid_at = v_now,
    activated_at = v_now,
    eligible_from = v_eligible_from,
    entry_baseline_points = 0
  where id = v_participation.id
    and payment_status = v_previous_status;

  if not found then
    raise exception 'manual confirmation race lost for participation %', v_participation.id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'code', 'confirmed',
    'transitioned', true,
    'message', 'Pago confirmado. Participación habilitada.',
    'participation_id', v_participation.id,
    'previous_status', v_previous_status,
    'new_status', 'paid',
    'attempts_audited', greatest(v_attempt_count, 1)
  );
end;
$$;

create or replace function public.reject_manual_participation_payment(
  p_participation_id uuid,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin public.profiles%rowtype;
  v_participation public.participations%rowtype;
  v_now timestamptz := now();
  v_attempt_count integer := 0;
  v_paid_attempt_count integer := 0;
  v_previous_status text;
begin
  select *
  into v_admin
  from public.profiles
  where id = auth.uid()
    and is_admin = true;

  if not found then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select *
  into v_participation
  from public.participations
  where id = p_participation_id
  for update;

  if not found then
    return jsonb_build_object(
      'ok', false,
      'code', 'participation_not_found',
      'message', 'No pudimos encontrar la participación.'
    );
  end if;

  v_previous_status := v_participation.payment_status;

  if v_participation.payment_status = 'paid' then
    return jsonb_build_object(
      'ok', false,
      'code', 'already_paid',
      'transitioned', false,
      'message', 'No se puede rechazar una participación que ya está confirmada.',
      'participation_id', v_participation.id,
      'previous_status', v_previous_status,
      'new_status', v_participation.payment_status
    );
  end if;

  select count(*)
  into v_paid_attempt_count
  from public.payment_attempts
  where participation_id = v_participation.id
    and status = 'paid';

  if v_paid_attempt_count > 0 then
    return jsonb_build_object(
      'ok', false,
      'code', 'paid_attempt_exists',
      'transitioned', false,
      'message', 'No se puede rechazar: existe un intento de pago aprobado.',
      'participation_id', v_participation.id,
      'previous_status', v_previous_status
    );
  end if;

  if v_participation.payment_status = 'rejected' then
    return jsonb_build_object(
      'ok', true,
      'code', 'already_rejected',
      'transitioned', false,
      'message', 'Pago ya rechazado. El jugador puede volver a iniciar el pago.',
      'participation_id', v_participation.id,
      'previous_status', v_previous_status,
      'new_status', v_participation.payment_status
    );
  end if;

  if v_participation.payment_status not in (
    'pending',
    'draft_predictions',
    'payment_started',
    'payment_pending',
    'manual_review'
  ) then
    return jsonb_build_object(
      'ok', false,
      'code', 'invalid_status',
      'message', 'No se puede rechazar una participación en estado ' || v_participation.payment_status || '.',
      'participation_id', v_participation.id,
      'previous_status', v_previous_status
    );
  end if;

  select count(*)
  into v_attempt_count
  from public.payment_attempts
  where participation_id = v_participation.id
    and status in ('created', 'payment_started', 'payment_pending', 'manual_review');

  if v_attempt_count = 0 then
    insert into public.payment_attempts (
      participation_id,
      profile_id,
      provider,
      external_reference,
      amount,
      currency,
      status,
      raw_provider_response
    )
    values (
      v_participation.id,
      v_participation.profile_id,
      'manual_admin',
      'soliprode:manual-rejection:' || v_participation.id::text || ':' || gen_random_uuid()::text,
      coalesce(v_participation.entry_price, 0),
      'ARS',
      'rejected',
      jsonb_build_object(
        'manual_rejection', jsonb_build_object(
          'rejected_at', v_now,
          'rejected_by', v_admin.id,
          'rejected_by_email', v_admin.email,
          'reason', nullif(btrim(coalesce(p_reason, '')), ''),
          'previous_status', v_previous_status,
          'new_status', 'rejected',
          'source', 'admin',
          'provider', 'manual_admin',
          'original_mercadopago_attempt_id', null
        )
      )
    );
  else
    update public.payment_attempts
    set
      status = 'rejected',
      raw_provider_response = coalesce(raw_provider_response, '{}'::jsonb)
        || jsonb_build_object(
          'manual_rejection', jsonb_build_object(
            'rejected_at', v_now,
            'rejected_by', v_admin.id,
            'rejected_by_email', v_admin.email,
            'reason', nullif(btrim(coalesce(p_reason, '')), ''),
            'previous_attempt_status', status,
            'previous_status', v_previous_status,
            'new_status', 'rejected',
            'source', 'admin',
            'provider', provider,
            'original_mercadopago_attempt_id',
              case when provider = 'mercadopago' then id else null end,
            'provider_preference_id', provider_preference_id,
            'provider_payment_id', provider_payment_id,
            'external_reference', external_reference
          )
        )
    where participation_id = v_participation.id
      and status in ('created', 'payment_started', 'payment_pending', 'manual_review');
  end if;

  update public.participations
  set
    payment_status = 'rejected',
    payment_provider = 'mercadopago'
  where id = v_participation.id
    and payment_status = v_previous_status;

  if not found then
    raise exception 'manual rejection race lost for participation %', v_participation.id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'code', 'rejected',
    'transitioned', true,
    'message', 'Pago rechazado. El jugador puede volver a iniciar el pago.',
    'participation_id', v_participation.id,
    'previous_status', v_previous_status,
    'new_status', 'rejected',
    'attempts_audited', greatest(v_attempt_count, 1)
  );
end;
$$;

grant execute on function public.confirm_manual_participation_payment(uuid) to authenticated;
grant execute on function public.reject_manual_participation_payment(uuid, text) to authenticated;
