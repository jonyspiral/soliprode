-- SoliProde comprehensive runtime grants
-- Scope: stop resolving SQL grants table by table. This migration aligns
-- the SQL-level privileges with the app's actual runtime model:
-- - anon/public read on tournament data
-- - authenticated write constrained by RLS
-- - service_role full server-side orchestration across product tables

-- Public read surfaces that are already protected by explicit RLS policies.
revoke all on table public.teams from anon;
revoke all on table public.matches from anon;
revoke all on table public.rankings_cache from anon;
grant select on table public.teams to anon;
grant select on table public.matches to anon;
grant select on table public.rankings_cache to anon;

-- Authenticated browser/runtime grants.
revoke all on table public.profiles from authenticated;
revoke all on table public.participations from authenticated;
revoke all on table public.communities from authenticated;
revoke all on table public.groups from authenticated;
revoke all on table public.predictions from authenticated;
revoke all on table public.bonus_predictions from authenticated;
revoke all on table public.payment_attempts from authenticated;

grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update on table public.participations to authenticated;
grant select, insert, update on table public.communities to authenticated;
grant select, insert, update on table public.groups to authenticated;
grant select, insert, update on table public.predictions to authenticated;
grant select, insert, update on table public.bonus_predictions to authenticated;
grant select on table public.payment_attempts to authenticated;

-- Server-side orchestration grants. The app uses service_role for admin flows,
-- payment orchestration, operational reads, and future backoffice actions.
revoke all on table public.profiles from service_role;
revoke all on table public.promoters from service_role;
revoke all on table public.communities from service_role;
revoke all on table public.groups from service_role;
revoke all on table public.participations from service_role;
revoke all on table public.teams from service_role;
revoke all on table public.matches from service_role;
revoke all on table public.predictions from service_role;
revoke all on table public.bonus_predictions from service_role;
revoke all on table public.rankings_cache from service_role;
revoke all on table public.payment_attempts from service_role;

grant select, insert, update, delete on table public.profiles to service_role;
grant select, insert, update, delete on table public.promoters to service_role;
grant select, insert, update, delete on table public.communities to service_role;
grant select, insert, update, delete on table public.groups to service_role;
grant select, insert, update, delete on table public.participations to service_role;
grant select, insert, update, delete on table public.teams to service_role;
grant select, insert, update, delete on table public.matches to service_role;
grant select, insert, update, delete on table public.predictions to service_role;
grant select, insert, update, delete on table public.bonus_predictions to service_role;
grant select, insert, update, delete on table public.rankings_cache to service_role;
grant select, insert, update, delete on table public.payment_attempts to service_role;
