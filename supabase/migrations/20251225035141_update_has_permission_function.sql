-- Update the has_permission function to check admin_granted_permissions instead of permissions table

create or replace function private.has_permission(p_perm text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select true
    from public.admin_granted_permissions agp
    where agp.admin_id = auth.uid()
    and agp.permission_key = p_perm
    and agp.is_active = true
    limit 1
  ), false);
$$;