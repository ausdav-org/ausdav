-- Add committee_changing_phase flag to app_settings
-- This flag controls whether honourable promotions and committee changes are allowed.
-- Default to true for existing installs to preserve current behaviour.

ALTER TABLE IF EXISTS app_settings
ADD COLUMN IF NOT EXISTS committee_changing_phase boolean DEFAULT true;

-- Ensure existing rows are set (in case of NULL)
UPDATE app_settings
SET committee_changing_phase = true
WHERE committee_changing_phase IS NULL;
