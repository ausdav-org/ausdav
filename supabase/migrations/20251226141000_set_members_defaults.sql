-- Set sensible defaults for members table properties
-- Ensure role defaults to 'member', designation defaults to 'none', phone defaults to empty string

ALTER TABLE IF EXISTS public.members
  ALTER COLUMN role SET DEFAULT 'member',
  ALTER COLUMN designation SET DEFAULT 'none',
  ALTER COLUMN phone SET DEFAULT '';

-- Backfill existing rows where these fields are NULL or empty
UPDATE public.members
SET role = 'member'
WHERE role IS NULL OR role = '';

UPDATE public.members
SET designation = 'none'
WHERE designation IS NULL OR designation = '';

UPDATE public.members
SET phone = ''
WHERE phone IS NULL;
