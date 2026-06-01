-- SoliProde initial schema
-- Scope: base entities, indexes and starter RLS only.
-- No seed data and no app logic are included in this migration.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  public_alias text not null,
  whatsapp text,
  email text,
  role text not null default 'player',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('player', 'promoter', 'admin'))
);

create table public.promoters (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  profile_id uuid references public.profiles (id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_profile_id uuid references public.profiles (id) on delete set null,
  visibility text not null default 'public',
  invite_code text unique,
  created_at timestamptz not null default now(),
  constraint communities_visibility_check check (visibility in ('public', 'private'))
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  community_id uuid references public.communities (id) on delete set null,
  name text not null,
  slug text not null unique,
  owner_profile_id uuid references public.profiles (id) on delete set null,
  visibility text not null default 'public',
  invite_code text unique,
  created_at timestamptz not null default now(),
  constraint groups_visibility_check check (visibility in ('public', 'private'))
);

create table public.participations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  promoter_id uuid references public.promoters (id) on delete set null,
  community_id uuid references public.communities (id) on delete set null,
  group_id uuid references public.groups (id) on delete set null,
  payment_status text not null default 'pending',
  payment_reference text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  constraint participations_payment_status_check check (
    payment_status in ('pending', 'paid', 'failed', 'refunded')
  )
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  flag_url text,
  created_at timestamptz not null default now()
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  home_team_id uuid not null references public.teams (id) on delete restrict,
  away_team_id uuid not null references public.teams (id) on delete restrict,
  phase text not null,
  group_name text,
  starts_at timestamptz not null,
  status text not null default 'scheduled',
  score_home integer,
  score_away integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint matches_status_check check (
    status in ('scheduled', 'live', 'finished', 'cancelled')
  ),
  constraint matches_distinct_teams_check check (home_team_id <> away_team_id),
  constraint matches_score_non_negative_check check (
    (score_home is null or score_home >= 0)
    and (score_away is null or score_away >= 0)
  )
);

create table public.predictions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  match_id uuid not null references public.matches (id) on delete cascade,
  predicted_home integer not null,
  predicted_away integer not null,
  points integer not null default 0,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint predictions_unique_profile_match unique (profile_id, match_id),
  constraint predictions_scores_non_negative_check check (
    predicted_home >= 0 and predicted_away >= 0
  ),
  constraint predictions_points_non_negative_check check (points >= 0)
);

create table public.bonus_predictions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  champion_team_id uuid references public.teams (id) on delete set null,
  runner_up_team_id uuid references public.teams (id) on delete set null,
  top_scorer text,
  argentina_stage text,
  points integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bonus_predictions_points_non_negative_check check (points >= 0)
);

create table public.rankings_cache (
  id uuid primary key default gen_random_uuid(),
  ranking_type text not null,
  scope_id uuid,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  points integer not null default 0,
  position integer,
  updated_at timestamptz not null default now(),
  constraint rankings_cache_position_positive_check check (
    position is null or position > 0
  ),
  constraint rankings_cache_points_non_negative_check check (points >= 0)
);

create index profiles_role_idx on public.profiles (role);
create index promoters_profile_id_idx on public.promoters (profile_id);
create index promoters_active_idx on public.promoters (active);
create index communities_owner_profile_id_idx on public.communities (owner_profile_id);
create index communities_visibility_idx on public.communities (visibility);
create index groups_community_id_idx on public.groups (community_id);
create index groups_owner_profile_id_idx on public.groups (owner_profile_id);
create index groups_visibility_idx on public.groups (visibility);
create index participations_profile_id_idx on public.participations (profile_id);
create index participations_promoter_id_idx on public.participations (promoter_id);
create index participations_community_id_idx on public.participations (community_id);
create index participations_group_id_idx on public.participations (group_id);
create index participations_payment_status_idx on public.participations (payment_status);
create index matches_home_team_id_idx on public.matches (home_team_id);
create index matches_away_team_id_idx on public.matches (away_team_id);
create index matches_phase_idx on public.matches (phase);
create index matches_starts_at_idx on public.matches (starts_at);
create index matches_status_starts_at_idx on public.matches (status, starts_at);
create index predictions_match_id_idx on public.predictions (match_id);
create index predictions_locked_at_idx on public.predictions (locked_at);
create index bonus_predictions_champion_team_id_idx on public.bonus_predictions (champion_team_id);
create index bonus_predictions_runner_up_team_id_idx on public.bonus_predictions (runner_up_team_id);
create index rankings_cache_profile_id_idx on public.rankings_cache (profile_id);
create index rankings_cache_lookup_idx on public.rankings_cache (ranking_type, scope_id, position);

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger set_matches_updated_at
before update on public.matches
for each row
execute function public.set_updated_at();

create trigger set_predictions_updated_at
before update on public.predictions
for each row
execute function public.set_updated_at();

create trigger set_bonus_predictions_updated_at
before update on public.bonus_predictions
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.promoters enable row level security;
alter table public.communities enable row level security;
alter table public.groups enable row level security;
alter table public.participations enable row level security;
alter table public.teams enable row level security;
alter table public.matches enable row level security;
alter table public.predictions enable row level security;
alter table public.bonus_predictions enable row level security;
alter table public.rankings_cache enable row level security;

-- Public read access is intentionally limited to tournament metadata and cached rankings.
create policy "public can read teams"
on public.teams
for select
to public
using (true);

create policy "public can read matches"
on public.matches
for select
to public
using (true);

create policy "public can read rankings cache"
on public.rankings_cache
for select
to public
using (true);

-- Profiles are private by default; an authenticated user can only read their own row.
create policy "authenticated users can read own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

-- Participations are user-scoped because they may later contain payment state or promoter attribution.
create policy "authenticated users can read own participations"
on public.participations
for select
to authenticated
using (auth.uid() = profile_id);

-- Predictions are private writeable records; each user can only read their own predictions.
create policy "authenticated users can read own predictions"
on public.predictions
for select
to authenticated
using (auth.uid() = profile_id);

-- Insert is limited to the authenticated user's own profile_id to prevent cross-account writes.
create policy "authenticated users can insert own predictions"
on public.predictions
for insert
to authenticated
with check (auth.uid() = profile_id);

-- Update is limited to the authenticated user's own prediction rows only.
create policy "authenticated users can update own predictions"
on public.predictions
for update
to authenticated
using (auth.uid() = profile_id)
with check (auth.uid() = profile_id);
