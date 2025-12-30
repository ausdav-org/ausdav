-- Migration: Create org_contact_settings table

BEGIN;

CREATE TABLE IF NOT EXISTS public.org_contact_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  phone TEXT NULL,
  email TEXT NULL,
  address TEXT NULL,
  bank_name TEXT NULL,
  account_name TEXT NULL,
  account_number TEXT NULL,
  branch TEXT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NULL
);

-- Ensure single-row access pattern (id = 1)
CREATE UNIQUE INDEX IF NOT EXISTS idx_org_contact_singleton ON public.org_contact_settings(id);

-- Use shared updated_at trigger if available
DROP TRIGGER IF EXISTS trigger_org_contact_updated_at ON public.org_contact_settings;
CREATE TRIGGER trigger_org_contact_updated_at
  BEFORE UPDATE ON public.org_contact_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed a default row if missing so reads don't need null checks
INSERT INTO public.org_contact_settings (id)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM public.org_contact_settings WHERE id = 1);

COMMIT;
