-- SoliProde authenticated runtime grants correction
-- Scope: align SQL grants with existing authenticated-user RLS policies so
-- browser auth flows can read/write their own rows without one-off grant fixes.
-- No tables, data or policies are removed here.

-- Profiles are read and upserted by the authenticated user during bootstrap.
revoke all on table public.profiles from authenticated;
grant select, insert, update on table public.profiles to authenticated;

-- Participations are created and checked during the initial signup/login flow.
revoke all on table public.participations from authenticated;
grant select, insert, update on table public.participations to authenticated;

-- Public groups and communities are read in-app, and owners can create/update their own rows.
revoke all on table public.communities from authenticated;
grant select, insert, update on table public.communities to authenticated;

revoke all on table public.groups from authenticated;
grant select, insert, update on table public.groups to authenticated;

-- Match predictions stay fully constrained by RLS, but the authenticated role
-- still needs SQL-level privileges to exercise those policies.
revoke all on table public.predictions from authenticated;
grant select, insert, update on table public.predictions to authenticated;

revoke all on table public.bonus_predictions from authenticated;
grant select, insert, update on table public.bonus_predictions to authenticated;
