-- Function to check if NIC already exists in applicants table
create or replace function check_nic_exists(p_nic text)
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (select 1 from public.applicants where nic = p_nic);
end;
$$;