-- SoliProde fixture upsert constraints
-- Scope: add true unique constraints for fixture imports that use PostgREST
-- upsert(onConflict: ...). Abort with a clear error if existing non-null data
-- contains duplicates.

do $$
declare
  duplicate_fifa_codes text;
  duplicate_match_numbers text;
begin
  if not exists (
    select 1
    from pg_constraint
    where connamespace = 'public'::regnamespace
      and conname = 'teams_fifa_code_unique'
  ) then
    select string_agg(fifa_code, ', ' order by fifa_code)
    into duplicate_fifa_codes
    from (
      select fifa_code
      from public.teams
      where fifa_code is not null
      group by fifa_code
      having count(*) > 1
    ) duplicates;

    if duplicate_fifa_codes is not null then
      raise exception using
        message = format(
          'Cannot add teams_fifa_code_unique: duplicate fifa_code values found (%s).',
          duplicate_fifa_codes
        ),
        errcode = '23505';
    end if;

    alter table public.teams
      add constraint teams_fifa_code_unique unique (fifa_code);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where connamespace = 'public'::regnamespace
      and conname = 'matches_match_number_unique'
  ) then
    select string_agg(match_number::text, ', ' order by match_number)
    into duplicate_match_numbers
    from (
      select match_number
      from public.matches
      where match_number is not null
      group by match_number
      having count(*) > 1
    ) duplicates;

    if duplicate_match_numbers is not null then
      raise exception using
        message = format(
          'Cannot add matches_match_number_unique: duplicate match_number values found (%s).',
          duplicate_match_numbers
        ),
        errcode = '23505';
    end if;

    alter table public.matches
      add constraint matches_match_number_unique unique (match_number);
  end if;
end
$$;

