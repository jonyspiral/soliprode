alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists avatar_seed text,
  add column if not exists avatar_variant text;

alter table public.groups
  add column if not exists avatar_url text,
  add column if not exists avatar_seed text,
  add column if not exists avatar_variant text;
