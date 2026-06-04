-- SoliProde promoter access and admin flags
-- Scope: split admin permission from the legacy role field and allow optional promoter-linked logins.

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

update public.profiles
set is_admin = true
where role = 'admin'
  and is_admin = false;

create index if not exists profiles_is_admin_idx on public.profiles (is_admin);

create unique index if not exists promoters_profile_id_unique_idx
  on public.promoters (profile_id)
  where profile_id is not null;

drop policy if exists "admins can insert teams" on public.teams;
create policy "admins can insert teams"
on public.teams
for insert
to authenticated
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.is_admin = true
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

drop policy if exists "admins can delete teams" on public.teams;
create policy "admins can delete teams"
on public.teams
for delete
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.is_admin = true
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
      and profiles.is_admin = true
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

drop policy if exists "admins can delete matches" on public.matches;
create policy "admins can delete matches"
on public.matches
for delete
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.is_admin = true
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
