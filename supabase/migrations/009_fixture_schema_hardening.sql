-- SoliProde fixture schema hardening
-- Scope: extend the existing teams/matches/predictions contract for real fixture
-- administration without seeding mock teams, matches or schedules.

create extension if not exists pgcrypto;

-- Teams: keep the legacy code/flag_url fields used by the current UI, and add
-- the official fixture fields requested for World Cup operations.
alter table public.teams
  add column if not exists short_name text,
  add column if not exists fifa_code text,
  add column if not exists country_code text,
  add column if not exists flag_emoji text,
  add column if not exists group_code text,
  add column if not exists group_position integer,
  add column if not exists updated_at timestamptz not null default now();

update public.teams
set
  short_name = coalesce(short_name, name),
  fifa_code = coalesce(fifa_code, upper(code)),
  country_code = coalesce(country_code, left(upper(code), 2)),
  flag_emoji = coalesce(flag_emoji, '🏳️')
where short_name is null
  or fifa_code is null
  or country_code is null
  or flag_emoji is null;

alter table public.teams
  alter column short_name set not null,
  alter column fifa_code set not null,
  alter column country_code set not null,
  alter column flag_emoji set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'teams_fifa_code_unique') then
    alter table public.teams add constraint teams_fifa_code_unique unique (fifa_code);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'teams_country_code_check') then
    alter table public.teams add constraint teams_country_code_check
      check (country_code ~ '^[A-Z]{2}$');
  end if;

  if not exists (select 1 from pg_constraint where conname = 'teams_fifa_code_check') then
    alter table public.teams add constraint teams_fifa_code_check
      check (fifa_code ~ '^[A-Z0-9]{2,4}$');
  end if;

  if not exists (select 1 from pg_constraint where conname = 'teams_group_code_check') then
    alter table public.teams add constraint teams_group_code_check
      check (group_code is null or group_code in ('A','B','C','D','E','F','G','H','I','J','K','L'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'teams_group_position_check') then
    alter table public.teams add constraint teams_group_position_check
      check (group_position is null or group_position > 0);
  end if;
end $$;

drop trigger if exists set_teams_updated_at on public.teams;
create trigger set_teams_updated_at
before update on public.teams
for each row
execute function public.set_updated_at();

create index if not exists teams_group_code_idx on public.teams (group_code, group_position);

-- Matches: extend the current match model while preserving the legacy fields
-- phase/group_name/score_home/score_away consumed by the app today.
alter table public.matches
  add column if not exists match_number integer,
  add column if not exists round_name text,
  add column if not exists stage text,
  add column if not exists group_code text,
  add column if not exists prediction_closes_at timestamptz,
  add column if not exists venue text,
  add column if not exists city text,
  add column if not exists home_score integer,
  add column if not exists away_score integer,
  add column if not exists result_locked boolean not null default false;

update public.matches
set
  round_name = coalesce(round_name, phase),
  stage = coalesce(stage, phase),
  group_code = coalesce(group_code, group_name),
  prediction_closes_at = coalesce(prediction_closes_at, starts_at),
  home_score = coalesce(home_score, score_home),
  away_score = coalesce(away_score, score_away)
where round_name is null
  or stage is null
  or prediction_closes_at is null
  or (home_score is null and score_home is not null)
  or (away_score is null and score_away is not null);

alter table public.matches
  alter column round_name set not null,
  alter column stage set not null,
  alter column prediction_closes_at set not null;

alter table public.matches
  drop constraint if exists matches_status_check;

alter table public.matches
  add constraint matches_status_check check (
    status in ('scheduled', 'closed', 'live', 'finished', 'cancelled')
  );

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'matches_group_code_check') then
    alter table public.matches add constraint matches_group_code_check
      check (group_code is null or group_code in ('A','B','C','D','E','F','G','H','I','J','K','L'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'matches_group_stage_requires_group_check') then
    alter table public.matches add constraint matches_group_stage_requires_group_check
      check (stage <> 'group_stage' or group_code is not null);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'matches_alias_scores_non_negative_check') then
    alter table public.matches add constraint matches_alias_scores_non_negative_check
      check (
        (home_score is null or home_score >= 0)
        and (away_score is null or away_score >= 0)
      );
  end if;
end $$;

create or replace function public.sync_match_score_aliases()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.score_home = coalesce(new.score_home, new.home_score);
    new.score_away = coalesce(new.score_away, new.away_score);
    new.home_score = coalesce(new.home_score, new.score_home);
    new.away_score = coalesce(new.away_score, new.score_away);
    return new;
  end if;

  if new.home_score is distinct from old.home_score then
    new.score_home = new.home_score;
  elsif new.score_home is distinct from old.score_home then
    new.home_score = new.score_home;
  end if;

  if new.away_score is distinct from old.away_score then
    new.score_away = new.away_score;
  elsif new.score_away is distinct from old.score_away then
    new.away_score = new.score_away;
  end if;

  return new;
end;
$$;

drop trigger if exists sync_match_score_aliases on public.matches;
create trigger sync_match_score_aliases
before insert or update on public.matches
for each row
execute function public.sync_match_score_aliases();

create index if not exists matches_group_code_idx on public.matches (group_code, starts_at);
create index if not exists matches_prediction_closes_at_idx on public.matches (prediction_closes_at);
create unique index if not exists matches_match_number_unique_idx
  on public.matches (match_number)
  where match_number is not null;

-- Predictions: preserve profile_id/predicted_home/predicted_away as the app's
-- canonical columns, and add synced aliases for the requested fixture contract.
alter table public.predictions
  add column if not exists user_id uuid,
  add column if not exists predicted_home_score integer,
  add column if not exists predicted_away_score integer;

update public.predictions
set
  user_id = coalesce(user_id, profile_id),
  predicted_home_score = coalesce(predicted_home_score, predicted_home),
  predicted_away_score = coalesce(predicted_away_score, predicted_away)
where user_id is null
  or predicted_home_score is null
  or predicted_away_score is null;

alter table public.predictions
  alter column user_id set not null,
  alter column predicted_home_score set not null,
  alter column predicted_away_score set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'predictions_user_id_fkey') then
    alter table public.predictions add constraint predictions_user_id_fkey
      foreign key (user_id) references auth.users (id) on delete cascade;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'predictions_unique_user_match') then
    alter table public.predictions add constraint predictions_unique_user_match unique (user_id, match_id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'predictions_alias_scores_non_negative_check') then
    alter table public.predictions add constraint predictions_alias_scores_non_negative_check
      check (predicted_home_score >= 0 and predicted_away_score >= 0);
  end if;
end $$;

create or replace function public.sync_prediction_aliases()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.profile_id = coalesce(new.profile_id, new.user_id);
    new.user_id = coalesce(new.user_id, new.profile_id);
    new.predicted_home = coalesce(new.predicted_home, new.predicted_home_score);
    new.predicted_away = coalesce(new.predicted_away, new.predicted_away_score);
    new.predicted_home_score = coalesce(new.predicted_home_score, new.predicted_home);
    new.predicted_away_score = coalesce(new.predicted_away_score, new.predicted_away);
    return new;
  end if;

  if new.user_id is distinct from old.user_id then
    new.profile_id = new.user_id;
  elsif new.profile_id is distinct from old.profile_id then
    new.user_id = new.profile_id;
  end if;

  if new.predicted_home_score is distinct from old.predicted_home_score then
    new.predicted_home = new.predicted_home_score;
  elsif new.predicted_home is distinct from old.predicted_home then
    new.predicted_home_score = new.predicted_home;
  end if;

  if new.predicted_away_score is distinct from old.predicted_away_score then
    new.predicted_away = new.predicted_away_score;
  elsif new.predicted_away is distinct from old.predicted_away then
    new.predicted_away_score = new.predicted_away;
  end if;

  return new;
end;
$$;

drop trigger if exists sync_prediction_aliases on public.predictions;
create trigger sync_prediction_aliases
before insert or update on public.predictions
for each row
execute function public.sync_prediction_aliases();

create index if not exists predictions_user_id_idx on public.predictions (user_id);

-- RLS and privileges.
alter table public.teams enable row level security;
alter table public.matches enable row level security;
alter table public.predictions enable row level security;

grant select on table public.teams to anon, authenticated;
grant select on table public.matches to anon, authenticated;
grant select, insert, update, delete on table public.predictions to authenticated;
grant insert, update, delete on table public.teams to authenticated;
grant insert, update, delete on table public.matches to authenticated;

grant select, insert, update, delete on table public.teams to service_role;
grant select, insert, update, delete on table public.matches to service_role;
grant select, insert, update, delete on table public.predictions to service_role;

drop policy if exists "admins can insert teams" on public.teams;
create policy "admins can insert teams"
on public.teams
for insert
to authenticated
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "admins can update teams" on public.teams;
create policy "admins can update teams"
on public.teams
for update
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "admins can delete teams" on public.teams;
create policy "admins can delete teams"
on public.teams
for delete
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "admins can insert matches" on public.matches;
create policy "admins can insert matches"
on public.matches
for insert
to authenticated
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "admins can update matches" on public.matches;
create policy "admins can update matches"
on public.matches
for update
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "admins can delete matches" on public.matches;
create policy "admins can delete matches"
on public.matches
for delete
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "authenticated users can insert own predictions" on public.predictions;
create policy "authenticated users can insert own predictions"
on public.predictions
for insert
to authenticated
with check (
  auth.uid() = profile_id
  and auth.uid() = user_id
  and exists (
    select 1 from public.matches
    where matches.id = predictions.match_id
      and matches.status = 'scheduled'
      and now() < matches.prediction_closes_at
  )
);

drop policy if exists "authenticated users can update own predictions" on public.predictions;
create policy "authenticated users can update own predictions"
on public.predictions
for update
to authenticated
using (
  auth.uid() = profile_id
  and exists (
    select 1 from public.matches
    where matches.id = predictions.match_id
      and matches.status = 'scheduled'
      and now() < matches.prediction_closes_at
  )
)
with check (
  auth.uid() = profile_id
  and auth.uid() = user_id
  and exists (
    select 1 from public.matches
    where matches.id = predictions.match_id
      and matches.status = 'scheduled'
      and now() < matches.prediction_closes_at
  )
);

drop policy if exists "authenticated users can delete own open predictions" on public.predictions;
create policy "authenticated users can delete own open predictions"
on public.predictions
for delete
to authenticated
using (
  auth.uid() = profile_id
  and exists (
    select 1 from public.matches
    where matches.id = predictions.match_id
      and matches.status = 'scheduled'
      and now() < matches.prediction_closes_at
  )
);

drop policy if exists "admins can manage predictions" on public.predictions;
create policy "admins can manage predictions"
on public.predictions
for all
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);
