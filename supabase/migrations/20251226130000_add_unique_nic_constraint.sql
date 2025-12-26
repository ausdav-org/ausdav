-- Add unique constraint on nic in applicants table
-- First, remove duplicate NIC entries, keeping the one with highest applicant_id
delete from public.applicants
where applicant_id not in (
  select max(applicant_id)
  from public.applicants
  group by nic
);

-- Now add the unique constraint
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'applicants_nic_unique'
  ) then
    alter table public.applicants add constraint applicants_nic_unique unique(nic);
  end if;
end $$;