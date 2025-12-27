begin;

-- Allow service-role updates to bypass the role/designation trigger via
-- session flag, and add a security-definer RPC to perform role updates.

-- 1) Replace trigger function to respect session flag `app.allow_service_role_updates`
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
  if current_setting('app.allow_service_role_updates', true) = 'true' then
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

-- Ensure trigger exists and points to the updated function (idempotent)
drop trigger if exists members_before_update on public.members;

create trigger members_before_update
before update on public.members
for each row execute function private.tg_members_before_update();

-- 2) Create a security-definer RPC that sets the session flag, performs the
-- update and returns the updated rows. This keeps the privileged logic
-- inside the database where it can be audited.
-- NOTE: Function is in PUBLIC schema so supabase-js .rpc() can call it.
drop function if exists public.set_member_roles(int[], text);

create or replace function public.set_member_roles(p_ids int[], p_role text)
returns table(mem_id int, role text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- set session flag visible to triggers for this session
  perform set_config('app.allow_service_role_updates', 'true', true);

  update public.members
  set role = p_role
  where public.members.mem_id = any(p_ids);

  -- unset is not strictly necessary because set_config with is_local=true
  -- only applies to this transaction/session, but we explicitly clear it.
  perform set_config('app.allow_service_role_updates', 'false', true);

  return query select m.mem_id, m.role from public.members m where m.mem_id = any(p_ids);
end;
$$;

-- Revoke from public/anon; only service role or authenticated with special grants can call
revoke all on function public.set_member_roles(int[], text) from public, anon;
grant execute on function public.set_member_roles(int[], text) to service_role;

commit;
