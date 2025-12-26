begin;

-- Replace the broad "members_manage_admin" policy with more specific policies
-- so that delete is restricted: super_admin can delete any row; admins
-- (private.has_permission('member')) can only delete rows where role = 'member'.

drop policy if exists members_manage_admin on public.members;

-- Allow select/insert/update for admins (but not delete)
drop policy if exists members_manage_non_delete on public.members;
create policy members_manage_non_delete
on public.members
for select, insert, update
to authenticated
using ( private.is_super_admin() or private.has_permission('member') )
with check ( private.is_super_admin() or private.has_permission('member') );

-- Delete policy: super_admin can delete any row; admins can delete only members
drop policy if exists members_delete_admin on public.members;
create policy members_delete_admin
on public.members
for delete
to authenticated
using (
  private.is_super_admin()
  or (private.has_permission('member') and role = 'member')
);

commit;
