-- Add batch column to app_settings so the admin signup batch can be configured
ALTER TABLE IF EXISTS app_settings
ADD COLUMN IF NOT EXISTS batch integer;
