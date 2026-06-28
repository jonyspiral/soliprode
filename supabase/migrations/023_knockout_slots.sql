-- SoliProde knockout slots
-- Scope: allow unresolved knockout matches to exist before teams are known.

alter table public.matches
  alter column home_team_id drop not null,
  alter column away_team_id drop not null;

alter table public.matches
  drop constraint if exists matches_distinct_teams_check;

alter table public.matches
  add constraint matches_distinct_teams_check check (
    home_team_id is null
    or away_team_id is null
    or home_team_id <> away_team_id
  );

alter table public.matches
  add column if not exists home_slot_rule text,
  add column if not exists away_slot_rule text,
  add column if not exists home_slot_label text,
  add column if not exists away_slot_label text,
  add column if not exists bracket_position text,
  add column if not exists bracket_side text;
