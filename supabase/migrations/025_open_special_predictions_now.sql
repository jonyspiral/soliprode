-- SoliProde special predictions opening windows
-- Scope: align existing special questions with real tournament lock times.

drop policy if exists "authenticated users can insert own open special predictions" on public.special_predictions;
create policy "authenticated users can insert own open special predictions"
on public.special_predictions
for insert
to authenticated
with check (
  auth.uid() = profile_id
  and exists (
    select 1
    from public.special_prediction_questions question
    join public.special_prediction_options option_row
      on option_row.question_id = question.id
    where question.id = special_predictions.question_id
      and option_row.id = special_predictions.option_id
      and option_row.active = true
      and question.status not in ('closed', 'resolved')
      and now() < question.closes_at
  )
);

drop policy if exists "authenticated users can update own open special predictions" on public.special_predictions;
create policy "authenticated users can update own open special predictions"
on public.special_predictions
for update
to authenticated
using (
  auth.uid() = profile_id
  and exists (
    select 1
    from public.special_prediction_questions question
    where question.id = special_predictions.question_id
      and question.status not in ('closed', 'resolved')
      and now() < question.closes_at
  )
)
with check (
  auth.uid() = profile_id
  and exists (
    select 1
    from public.special_prediction_questions question
    join public.special_prediction_options option_row
      on option_row.question_id = question.id
    where question.id = special_predictions.question_id
      and option_row.id = special_predictions.option_id
      and option_row.active = true
      and question.status not in ('closed', 'resolved')
      and now() < question.closes_at
  )
);

with first_round_of_16 as (
  select coalesce(
    (
      select min(prediction_closes_at)
      from public.matches
      where stage = 'round_of_16'
    ),
    timezone('utc', now()) + interval '14 days'
  ) as closes_at
),
first_quarter_finals as (
  select coalesce(
    (
      select min(prediction_closes_at)
      from public.matches
      where stage = 'quarter_finals'
    ),
    timezone('utc', now()) + interval '21 days'
  ) as closes_at
)
update public.special_prediction_questions question
set
  closes_at = case
    when question.code in ('CAMPEON_MUNDIAL', 'SUBCAMPEON_MUNDIAL', 'ARGENTINA_STAGE')
      then (select closes_at from first_round_of_16)
    when question.code in ('GOLDEN_BOOT', 'GOLDEN_BALL', 'BEST_GOALKEEPER', 'BEST_YOUNG_PLAYER')
      then (select closes_at from first_quarter_finals)
    else question.closes_at
  end,
  status = case
    when question.status = 'resolved' then 'resolved'
    when case
      when question.code in ('CAMPEON_MUNDIAL', 'SUBCAMPEON_MUNDIAL', 'ARGENTINA_STAGE')
        then (select closes_at from first_round_of_16)
      when question.code in ('GOLDEN_BOOT', 'GOLDEN_BALL', 'BEST_GOALKEEPER', 'BEST_YOUNG_PLAYER')
        then (select closes_at from first_quarter_finals)
      else question.closes_at
    end > now()
      then 'open'
    else 'closed'
  end
where question.code in (
  'CAMPEON_MUNDIAL',
  'SUBCAMPEON_MUNDIAL',
  'ARGENTINA_STAGE',
  'GOLDEN_BOOT',
  'GOLDEN_BALL',
  'BEST_GOALKEEPER',
  'BEST_YOUNG_PLAYER'
);
