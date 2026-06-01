-- SoliProde corrective migration
-- Syncs repository state with the manual patch already applied in the database.
-- No data deletion, no table drops, no UI coupling.

-- Harden grants on the public promoter view so only SELECT remains available.
revoke all privileges on table public.active_promoters_public from anon;
revoke all privileges on table public.active_promoters_public from authenticated;
grant select on table public.active_promoters_public to anon;
grant select on table public.active_promoters_public to authenticated;

-- Refresh bonus prediction policies so each authenticated user can only manage their own row.
drop policy if exists "authenticated users can read own bonus predictions"
on public.bonus_predictions;

create policy "authenticated users can read own bonus predictions"
on public.bonus_predictions
for select
to authenticated
using (profile_id = auth.uid());

drop policy if exists "authenticated users can insert own bonus predictions"
on public.bonus_predictions;

create policy "authenticated users can insert own bonus predictions"
on public.bonus_predictions
for insert
to authenticated
with check (profile_id = auth.uid());

drop policy if exists "authenticated users can update own bonus predictions"
on public.bonus_predictions;

create policy "authenticated users can update own bonus predictions"
on public.bonus_predictions
for update
to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());
