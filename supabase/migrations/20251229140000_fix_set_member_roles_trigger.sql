begin;

-- Fix the trigger function to properly handle NULL when checking the session flag
-- The issue is that current_setting() can return NULL if the setting doesn't exist,
-- and NULL = 'true' evaluates to NULL (not TRUE), causing the condition to fail.
-- We use COALESCE to handle NULL properly.

create or replace function private.tg_members_before_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();

  -- If a service-side RPC set a session flag, allow the update (used by
  -- server-side functions that run with the service role).
  -- Use COALESCE to handle NULL properly - if the setting doesn't exist,
  -- current_setting returns NULL, and we want to treat that as 'false'.
  if coalesce(current_setting('app.allow_service_role_updates', true), 'false') = 'true' then
    return new;
  end if;

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

commit;

