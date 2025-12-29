-- Allow anonymous users to read members with designations for public committee page
-- This makes the executive committee page publicly accessible to all viewers
begin;

-- Grant SELECT on members table to anon role (RLS will still restrict what they can see)
grant select on public.members to anon;
-- Also allow authenticated users (signed-in members/admins) to select
grant select on public.members to authenticated;

-- Create policy to allow anonymous users to read members with designations
-- This allows anyone to view committee members on the public committee page
drop policy if exists members_read_public_committee on public.members;

create policy members_read_public_committee
on public.members
for select
to anon
using (
  designation is not null 
  and designation != 'none'
  and designation != ''
);

-- Duplicate policy for authenticated role so signed-in users can also read
drop policy if exists members_read_public_committee_auth on public.members;
create policy members_read_public_committee_auth
on public.members
for select
to authenticated
using (
  designation is not null 
  and designation != 'none'
  and designation != ''
);

-- Allow anonymous users to read member profile images from member-profiles bucket
-- This ensures profile photos are visible on the public committee page
-- Note: This allows public read access to all member-profiles, which is acceptable
-- for a public committee page where member photos should be visible
drop policy if exists member_profiles_read_public on storage.objects;

create policy member_profiles_read_public
on storage.objects
for select
to anon
using (bucket_id = 'member-profiles');

-- Allow authenticated users to read profile objects from member-profiles
drop policy if exists member_profiles_read_public_auth on storage.objects;
create policy member_profiles_read_public_auth
on storage.objects
for select
to authenticated
using (bucket_id = 'member-profiles');

-- Also grant SELECT on storage.objects to authenticated so DB-level permission exists
grant select on storage.objects to authenticated;

commit;

