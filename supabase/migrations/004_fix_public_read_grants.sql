-- SoliProde public read grants correction
-- Scope: align SQL grants with existing public-read RLS policies.
-- No tables, data or policies are removed here.

revoke all on table public.teams from anon;
revoke all on table public.teams from authenticated;
grant select on table public.teams to anon;
grant select on table public.teams to authenticated;

revoke all on table public.matches from anon;
revoke all on table public.matches from authenticated;
grant select on table public.matches to anon;
grant select on table public.matches to authenticated;

revoke all on table public.rankings_cache from anon;
revoke all on table public.rankings_cache from authenticated;
grant select on table public.rankings_cache to anon;
grant select on table public.rankings_cache to authenticated;
