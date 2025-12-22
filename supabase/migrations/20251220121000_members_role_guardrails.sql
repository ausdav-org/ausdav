begin;

--------------------------------------------------------------------------------
-- 1) DEFAULTS: force initial role/designation
--------------------------------------------------------------------------------
alter table public.members
  alter column role set default 'member';

alter table public.members
  alter column designation set default 'none';

-- Optional cleanup if any NULLs exist already
update public.members
set
  role = coalesce(role, 'member'),
  designation = coalesce(designation, 'none')
where role is null or designation is null;

--------------------------------------------------------------------------------
-- 2) RLS: INSERT policy for self-signups (must start as member/none)
--------------------------------------------------------------------------------
drop policy if exists members_insert_self on public.members;

create policy members_insert_self
on public.members
for insert
to authenticated
with check (
  auth_user_id = auth.uid()
  and role = 'member'
  and designation = 'none'
);

--------------------------------------------------------------------------------
-- 3) RLS: Make sure only SUPER ADMIN can change role/designation
--    (We will enforce this mainly via trigger, but remove "member-permission = all"
--     if you had it.)
--------------------------------------------------------------------------------

-- If you previously created this policy (from earlier scripts), drop it.
drop policy if exists members_manage_admin on public.members;

-- Super admin can do anything
drop policy if exists members_manage_super_admin on public.members;
create policy members_manage_super_admin
on public.members
for all
to authenticated
using (private.is_super_admin())
with check (private.is_super_admin());

-- Optional: If you still want "member permission" users to update other people’s
-- profiles (but NOT role/designation), keep this UPDATE policy.
-- If you do NOT want them managing others, comment this out.
drop policy if exists members_update_staff on public.members;
create policy members_update_staff
on public.members
for update
to authenticated
using (private.has_permission('member'))
with check (private.has_permission('member'));

--------------------------------------------------------------------------------
-- 4) Trigger: allow updates to everything EXCEPT role/designation unless super admin
--------------------------------------------------------------------------------
create or replace function private.tg_members_before_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();

  -- Super admin can update anything (including role/designation)
  if private.is_super_admin() then
    return new;
  end if;

  -- Staff (member-permission) can update any fields EXCEPT role/designation
  if private.has_permission('member') then
    if new.role is distinct from old.role then
      raise exception 'forbidden';
    end if;

    if new.designation is distinct from old.designation then
      raise exception 'forbidden';
    end if;

    -- also protect identity columns
    if new.mem_id is distinct from old.mem_id then
      raise exception 'forbidden';
    end if;

    if new.auth_user_id is distinct from old.auth_user_id then
      raise exception 'forbidden';
    end if;

    if new.created_at is distinct from old.created_at then
      raise exception 'forbidden';
    end if;

    return new;
  end if;

  -- Normal member: must be updating own row
  if old.auth_user_id is distinct from auth.uid() then
    raise exception 'forbidden';
  end if;

  -- Normal member: cannot change role/designation
  if new.role is distinct from old.role then
    raise exception 'forbidden';
  end if;

  if new.designation is distinct from old.designation then
    raise exception 'forbidden';
  end if;

  -- Protect identity columns
  if new.mem_id is distinct from old.mem_id then
    raise exception 'forbidden';
  end if;

  if new.auth_user_id is distinct from old.auth_user_id then
    raise exception 'forbidden';
  end if;

  if new.created_at is distinct from old.created_at then
    raise exception 'forbidden';
  end if;

  -- Everything else is allowed
  return new;
end;
$$;

-- Ensure the trigger exists and points to the updated function
drop trigger if exists members_before_update on public.members;

create trigger members_before_update
before update on public.members
for each row execute function private.tg_members_before_update();

--------------------------------------------------------------------------------
-- 5) (Recommended) Auto-create permissions row after member insert
--------------------------------------------------------------------------------
create or replace function private.tg_members_after_insert_permissions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.permissions (id)
  values (new.mem_id)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists members_after_insert_permissions on public.members;

create trigger members_after_insert_permissions
after insert on public.members
for each row execute function private.tg_members_after_insert_permissions();

commit;
