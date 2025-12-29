-- Update is_super_admin to check members table and user metadata
create or replace function private.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.app_config c
    where c.id = 1
      and c.super_admin_id = auth.uid()
  )
  or exists (
    select 1
    from public.members m
    where m.auth_user_id = auth.uid()
      and m.role = 'super_admin'
  )
  or (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_super_admin' = 'true'
    or ((auth.jwt() ->> 'user_metadata')::jsonb -> 'roles')::text like '%super_admin%'
  );
$$;
