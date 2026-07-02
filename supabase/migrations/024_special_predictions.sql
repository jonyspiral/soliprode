-- SoliProde special predictions
-- Scope: add reglamento-driven special picks without mixing them with match predictions.

create table if not exists public.special_prediction_questions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text,
  points integer not null,
  closes_at timestamptz not null,
  status text not null default 'scheduled',
  result_value text,
  created_at timestamptz not null default now(),
  constraint special_prediction_questions_points_positive_check check (points > 0),
  constraint special_prediction_questions_status_check check (
    status in ('scheduled', 'open', 'closed', 'resolved')
  )
);

create table if not exists public.special_prediction_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.special_prediction_questions (id) on delete cascade,
  value text not null,
  label text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  constraint special_prediction_options_question_value_unique unique (question_id, value)
);

create table if not exists public.special_predictions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  question_id uuid not null references public.special_prediction_questions (id) on delete cascade,
  option_id uuid not null references public.special_prediction_options (id) on delete cascade,
  points integer not null default 0,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint special_predictions_profile_question_unique unique (profile_id, question_id),
  constraint special_predictions_points_non_negative_check check (points >= 0)
);

create index if not exists special_prediction_questions_status_closes_at_idx
  on public.special_prediction_questions (status, closes_at);

create index if not exists special_prediction_options_question_sort_idx
  on public.special_prediction_options (question_id, sort_order);

create index if not exists special_predictions_profile_id_idx
  on public.special_predictions (profile_id);

create index if not exists special_predictions_question_id_idx
  on public.special_predictions (question_id);

create index if not exists special_predictions_option_id_idx
  on public.special_predictions (option_id);

drop trigger if exists set_special_predictions_updated_at on public.special_predictions;
create trigger set_special_predictions_updated_at
before update on public.special_predictions
for each row
execute function public.set_updated_at();

alter table public.special_prediction_questions enable row level security;
alter table public.special_prediction_options enable row level security;
alter table public.special_predictions enable row level security;

grant select on table public.special_prediction_questions to anon;
grant select on table public.special_prediction_questions to authenticated;
grant select on table public.special_prediction_options to anon;
grant select on table public.special_prediction_options to authenticated;

grant select, insert, update on table public.special_predictions to authenticated;

grant select, insert, update, delete on table public.special_prediction_questions to service_role;
grant select, insert, update, delete on table public.special_prediction_options to service_role;
grant select, insert, update, delete on table public.special_predictions to service_role;

drop policy if exists "public can read special prediction questions" on public.special_prediction_questions;
create policy "public can read special prediction questions"
on public.special_prediction_questions
for select
to public
using (true);

drop policy if exists "public can read special prediction options" on public.special_prediction_options;
create policy "public can read special prediction options"
on public.special_prediction_options
for select
to public
using (true);

drop policy if exists "authenticated users can read own special predictions" on public.special_predictions;
create policy "authenticated users can read own special predictions"
on public.special_predictions
for select
to authenticated
using (auth.uid() = profile_id);

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
      and question.status = 'open'
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
      and question.status = 'open'
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
      and question.status = 'open'
      and now() < question.closes_at
  )
);

drop policy if exists "admins can manage special prediction questions" on public.special_prediction_questions;
create policy "admins can manage special prediction questions"
on public.special_prediction_questions
for all
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.is_admin = true
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.is_admin = true
  )
);

drop policy if exists "admins can manage special prediction options" on public.special_prediction_options;
create policy "admins can manage special prediction options"
on public.special_prediction_options
for all
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.is_admin = true
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.is_admin = true
  )
);

drop policy if exists "admins can manage special predictions" on public.special_predictions;
create policy "admins can manage special predictions"
on public.special_predictions
for all
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.is_admin = true
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.is_admin = true
  )
);

with seed_close as (
  select coalesce(
    (select min(prediction_closes_at) from public.matches),
    timezone('utc', now()) + interval '7 days'
  ) as closes_at
),
seed_questions as (
  select *
  from (
    values
      ('CAMPEON_MUNDIAL', 'Campeón del Mundial', 'Elegí qué selección va a salir campeona del Mundial.', 20),
      ('SUBCAMPEON_MUNDIAL', 'Subcampeón del Mundial', 'Elegí qué selección va a llegar a la final y perderla.', 10),
      ('ARGENTINA_STAGE', 'Hasta dónde llega Argentina', 'Pronosticá la mejor instancia alcanzada por Argentina.', 10),
      ('GOLDEN_BOOT', 'Bota de Oro', 'Elegí al jugador que termina como goleador del torneo.', 7),
      ('GOLDEN_BALL', 'Balón de Oro', 'Elegí al mejor jugador del Mundial.', 7),
      ('BEST_GOALKEEPER', 'Mejor arquero', 'Elegí al arquero destacado del Mundial.', 7),
      ('BEST_YOUNG_PLAYER', 'Mejor jugador joven', 'Elegí a la promesa destacada del torneo.', 7)
  ) as question_data(code, title, description, points)
)
insert into public.special_prediction_questions (
  code,
  title,
  description,
  points,
  closes_at,
  status
)
select
  seed_questions.code,
  seed_questions.title,
  seed_questions.description,
  seed_questions.points,
  seed_close.closes_at,
  case
    when seed_close.closes_at > now() then 'open'
    else 'closed'
  end
from seed_questions
cross join seed_close
on conflict (code) do update
set
  title = excluded.title,
  description = excluded.description,
  points = excluded.points,
  closes_at = excluded.closes_at;

insert into public.special_prediction_options (
  question_id,
  value,
  label,
  sort_order,
  active
)
select
  question.id,
  team.id::text,
  team.name,
  row_number() over (
    partition by question.id
    order by team.name asc, team.id asc
  ) - 1,
  true
from public.special_prediction_questions question
cross join public.teams team
where question.code in ('CAMPEON_MUNDIAL', 'SUBCAMPEON_MUNDIAL')
on conflict (question_id, value) do update
set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

with argentina_question as (
  select id
  from public.special_prediction_questions
  where code = 'ARGENTINA_STAGE'
),
argentina_options as (
  select *
  from (
    values
      ('octavos', 'Llega a octavos', 0),
      ('cuartos', 'Llega a cuartos', 1),
      ('semifinales', 'Llega a semifinales', 2),
      ('final', 'Llega a la final', 3),
      ('campeon', 'Sale campeón', 4)
  ) as option_data(value, label, sort_order)
)
insert into public.special_prediction_options (
  question_id,
  value,
  label,
  sort_order,
  active
)
select
  argentina_question.id,
  argentina_options.value,
  argentina_options.label,
  argentina_options.sort_order,
  true
from argentina_question
cross join argentina_options
on conflict (question_id, value) do update
set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

with award_options as (
  select *
  from (
    values
      ('GOLDEN_BOOT', 'mbappe', 'Kylian Mbappé', 0),
      ('GOLDEN_BOOT', 'vinicius_jr', 'Vinícius Júnior', 1),
      ('GOLDEN_BOOT', 'lautaro_martinez', 'Lautaro Martínez', 2),
      ('GOLDEN_BOOT', 'bellingham', 'Jude Bellingham', 3),
      ('GOLDEN_BOOT', 'haaland', 'Erling Haaland', 4),
      ('GOLDEN_BOOT', 'otro', 'Otro jugador (resolución admin)', 99),
      ('GOLDEN_BALL', 'mbappe', 'Kylian Mbappé', 0),
      ('GOLDEN_BALL', 'vinicius_jr', 'Vinícius Júnior', 1),
      ('GOLDEN_BALL', 'bellingham', 'Jude Bellingham', 2),
      ('GOLDEN_BALL', 'musiala', 'Jamal Musiala', 3),
      ('GOLDEN_BALL', 'lautaro_martinez', 'Lautaro Martínez', 4),
      ('GOLDEN_BALL', 'otro', 'Otro jugador (resolución admin)', 99),
      ('BEST_GOALKEEPER', 'dibu_martinez', 'Emiliano Martínez', 0),
      ('BEST_GOALKEEPER', 'alisson', 'Alisson', 1),
      ('BEST_GOALKEEPER', 'donnarumma', 'Gianluigi Donnarumma', 2),
      ('BEST_GOALKEEPER', 'courtois', 'Thibaut Courtois', 3),
      ('BEST_GOALKEEPER', 'maignan', 'Mike Maignan', 4),
      ('BEST_GOALKEEPER', 'otro', 'Otro arquero (resolución admin)', 99),
      ('BEST_YOUNG_PLAYER', 'yamal', 'Lamine Yamal', 0),
      ('BEST_YOUNG_PLAYER', 'bellingham', 'Jude Bellingham', 1),
      ('BEST_YOUNG_PLAYER', 'musiala', 'Jamal Musiala', 2),
      ('BEST_YOUNG_PLAYER', 'guler', 'Arda Güler', 3),
      ('BEST_YOUNG_PLAYER', 'endrick', 'Endrick', 4),
      ('BEST_YOUNG_PLAYER', 'otro', 'Otro joven (resolución admin)', 99)
  ) as option_data(question_code, value, label, sort_order)
)
insert into public.special_prediction_options (
  question_id,
  value,
  label,
  sort_order,
  active
)
select
  question.id,
  award_options.value,
  award_options.label,
  award_options.sort_order,
  true
from award_options
join public.special_prediction_questions question
  on question.code = award_options.question_code
on conflict (question_id, value) do update
set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;
