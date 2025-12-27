-- Restrict DELETE on members to admin and super_admin users
-- This enables row-level security and creates a policy that allows
-- deleting members only when the current user's role (stored in the
-- members table) is 'admin' or 'super_admin'. Super Admins with
-- service role still bypass RLS when using the service key.

BEGIN;

ALTER TABLE IF EXISTS members ENABLE ROW LEVEL SECURITY;

-- Revoke broad DELETE privileges; RLS will enforce who can delete.
REVOKE DELETE ON members FROM public;
REVOKE DELETE ON members FROM authenticated;

-- Grant DELETE to authenticated to allow deletes that satisfy RLS policies
GRANT DELETE ON members TO authenticated;

-- Create policy: allow delete only if the current user's role is admin or super_admin
DROP POLICY IF EXISTS "Allow admins and superadmins to delete members" ON members;
CREATE POLICY "Allow admins and superadmins to delete members" ON members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.auth_user_id = auth.uid()
        AND m.role IN ('admin', 'super_admin')
    )
  );

COMMIT;
