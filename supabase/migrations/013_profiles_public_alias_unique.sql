-- SoliProde profile public alias uniqueness
-- Scope: enforce one public game nickname per player with the same normalization used by the app.

create unique index if not exists profiles_public_alias_normalized_unique_idx
  on public.profiles ((lower(regexp_replace(btrim(public_alias), '\s+', ' ', 'g'))));
