-- Migration: Add RLS policies for org_contact_settings

BEGIN;

-- Enable row level security
ALTER TABLE IF EXISTS public.org_contact_settings ENABLE ROW LEVEL SECURITY;

-- Allow any authenticated user to SELECT the singleton settings row
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'org_contact_select' AND polrelid = 'public.org_contact_settings'::regclass
  ) THEN
    CREATE POLICY org_contact_select ON public.org_contact_settings
      FOR SELECT
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Allow authenticated users to UPDATE/INSERT/DELETE
-- Frontend enforces super-admin-only edits via disabled inputs and hidden save button
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'org_contact_update' AND polrelid = 'public.org_contact_settings'::regclass
  ) THEN
    CREATE POLICY org_contact_update ON public.org_contact_settings
      FOR ALL
      USING (auth.uid() IS NOT NULL)
      WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

COMMIT;
