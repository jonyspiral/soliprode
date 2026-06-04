-- SoliProde promoters admin contract
-- Scope: normalize promoters as an admin-only entity and keep participation attribution intact.

alter table public.promoters
  add column if not exists email text,
  add column if not exists whatsapp text,
  add column if not exists status text,
  add column if not exists notes text,
  add column if not exists updated_at timestamptz not null default now();

update public.promoters
set
  email = coalesce(public.promoters.email, profiles.email),
  whatsapp = coalesce(public.promoters.whatsapp, profiles.whatsapp)
from public.profiles
where public.promoters.profile_id = profiles.id
  and (
    public.promoters.email is null
    or public.promoters.whatsapp is null
  );

update public.promoters
set status = case
  when coalesce(active, true) = true then 'active'
  else 'inactive'
end
where status is null;

alter table public.promoters
  alter column status set default 'active';

alter table public.promoters
  alter column status set not null;

alter table public.promoters
  drop constraint if exists promoters_status_check;

alter table public.promoters
  add constraint promoters_status_check check (status in ('active', 'inactive'));

drop trigger if exists set_promoters_updated_at on public.promoters;
create trigger set_promoters_updated_at
before update on public.promoters
for each row
execute function public.set_updated_at();

drop index if exists promoters_active_idx;
create index if not exists promoters_status_idx on public.promoters (status);

create or replace view public.active_promoters_public
with (security_invoker = true) as
select
  code,
  name
from public.promoters
where status = 'active';
