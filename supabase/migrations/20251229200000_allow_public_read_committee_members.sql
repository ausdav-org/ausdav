-- Allow anonymous users to read members with designations for public committee page
begin;

-- Grant SELECT on members table to anon role (RLS will still restrict what they can see)
grant select on public.members to anon;

-- Create policy to allow anonymous users to read members with designations
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

commit;

