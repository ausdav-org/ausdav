-- Migration: Enable RLS and add policies for patrons

-- Enable row level security (idempotent)
alter table if exists public.patrons enable row level security;

-- Drop any existing policies for clarity (safe to run repeatedly)

-- Note: policies are dropped by name if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'patrons_public_select') THEN
    EXECUTE 'DROP POLICY IF EXISTS patrons_public_select ON public.patrons';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'patrons_super_admin') THEN
    EXECUTE 'DROP POLICY IF EXISTS patrons_super_admin ON public.patrons';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'patrons_service_role') THEN
    EXECUTE 'DROP POLICY IF EXISTS patrons_service_role ON public.patrons';
  END IF;
END $$;

-- 1) Allow anonymous (public) SELECT only for active patrons
-- (DROP handled above; CREATE POLICY without IF NOT EXISTS for compatibility)
CREATE POLICY patrons_public_select
  ON public.patrons
  FOR SELECT
  USING (is_active = true);

-- 2) Allow authenticated super-admins full CRUD using private.is_super_admin()
CREATE POLICY patrons_super_admin
  ON public.patrons
  FOR ALL
  USING (private.is_super_admin())
  WITH CHECK (private.is_super_admin());

-- 3) Allow the service_role (server) all operations
CREATE POLICY patrons_service_role
  ON public.patrons
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

--------------------------------------------------------------------------------
-- 4) STORAGE POLICIES for patrons bucket (storage.objects RLS)
--------------------------------------------------------------------------------

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS patrons_storage_read ON storage.objects;
DROP POLICY IF EXISTS patrons_storage_insert ON storage.objects;
DROP POLICY IF EXISTS patrons_storage_update ON storage.objects;
DROP POLICY IF EXISTS patrons_storage_delete ON storage.objects;

-- Public read access for patrons bucket (images are public)
CREATE POLICY patrons_storage_read
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'patrons');

-- Super admins can insert into patrons bucket
CREATE POLICY patrons_storage_insert
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'patrons' AND private.is_super_admin());

-- Super admins can update in patrons bucket
CREATE POLICY patrons_storage_update
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'patrons' AND private.is_super_admin())
  WITH CHECK (bucket_id = 'patrons' AND private.is_super_admin());

-- Super admins can delete from patrons bucket
CREATE POLICY patrons_storage_delete
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'patrons' AND private.is_super_admin());

-- Notes:
-- - `private.is_super_admin()` must exist (it's defined in earlier migrations).
-- - After deploying this migration, admin clients using the anonymous/public key will only be able to SELECT active patrons.
--   Admin writes (insert/update/delete) from client-side require the request to be made by a super-admin (via auth) or performed server-side using the service role.

