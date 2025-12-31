-- Ensure at least one super_admin remains in members table when not empty
-- This trigger prevents operations that would leave the table without any super_admin

BEGIN;

-- Function to check super_admin count constraint
CREATE OR REPLACE FUNCTION private.tg_members_ensure_super_admin_exists()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  remaining_super_admins INTEGER;
  total_members INTEGER;
BEGIN
  -- Count total members (excluding the current operation's effect)
  SELECT COUNT(*) INTO total_members FROM public.members;

  -- For DELETE operations
  IF TG_OP = 'DELETE' THEN
    -- If we're deleting a super_admin, check if others remain
    IF OLD.role = 'super_admin' THEN
      -- Count super_admins excluding the one being deleted
      SELECT COUNT(*) INTO remaining_super_admins
      FROM public.members
      WHERE role = 'super_admin' AND mem_id != OLD.mem_id;

      -- If this would leave no super_admins and table won't be empty, prevent it
      IF remaining_super_admins = 0 AND total_members > 1 THEN
        RAISE EXCEPTION 'Cannot delete the last super_admin. At least one super_admin must remain.';
      END IF;
    END IF;

    RETURN OLD;
  END IF;

  -- For UPDATE operations
  IF TG_OP = 'UPDATE' THEN
    -- If we're changing a super_admin's role to something else
    IF OLD.role = 'super_admin' AND NEW.role != 'super_admin' THEN
      -- Count super_admins excluding the one being changed
      SELECT COUNT(*) INTO remaining_super_admins
      FROM public.members
      WHERE role = 'super_admin' AND mem_id != OLD.mem_id;

      -- If this would leave no super_admins, prevent it
      IF remaining_super_admins = 0 THEN
        RAISE EXCEPTION 'Cannot change the last super_admin''s role. At least one super_admin must remain.';
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  -- For INSERT, no check needed as we already have the first super_admin trigger
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS ensure_super_admin_exists ON public.members;
CREATE TRIGGER ensure_super_admin_exists
  BEFORE UPDATE OR DELETE ON public.members
  FOR EACH ROW EXECUTE FUNCTION private.tg_members_ensure_super_admin_exists();

COMMIT;