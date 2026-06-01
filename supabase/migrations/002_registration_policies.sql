-- SoliProde registration policies
-- Scope: first registration flow only. No seed data and no UI coupling.

-- Profiles: authenticated users can create and maintain only their own profile row.
create policy "authenticated users can insert own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "authenticated users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Participations: authenticated users can create their own participation rows.
create policy "authenticated users can insert own participations"
on public.participations
for insert
to authenticated
with check (auth.uid() = profile_id);

-- Updates stay limited to the owner and only while the participation is still pending.
create policy "authenticated users can update own pending participations"
on public.participations
for update
to authenticated
using (auth.uid() = profile_id and payment_status = 'pending')
with check (auth.uid() = profile_id and payment_status = 'pending');

-- Communities: public can only read rows explicitly marked as public.
create policy "public can read public communities"
on public.communities
for select
to public
using (visibility = 'public');

create policy "authenticated users can insert own communities"
on public.communities
for insert
to authenticated
with check (auth.uid() = owner_profile_id);

create policy "owners can update own communities"
on public.communities
for update
to authenticated
using (auth.uid() = owner_profile_id)
with check (auth.uid() = owner_profile_id);

-- Groups: same starter model as communities.
create policy "public can read public groups"
on public.groups
for select
to public
using (visibility = 'public');

create policy "authenticated users can insert own groups"
on public.groups
for insert
to authenticated
with check (auth.uid() = owner_profile_id);

create policy "owners can update own groups"
on public.groups
for update
to authenticated
using (auth.uid() = owner_profile_id)
with check (auth.uid() = owner_profile_id);

-- Promoters requirement needs column-level restriction, which RLS alone cannot provide.
-- The safe starter approach is a narrow public view with only code + name for active rows.
create or replace view public.active_promoters_public
with (security_invoker = true) as
select
  code,
  name
from public.promoters
where active = true;

grant select on public.active_promoters_public to anon, authenticated;
