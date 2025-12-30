-- Migration: Add 'feedback' to admin_permissions

BEGIN;

-- Insert feedback admin permission if it does not already exist
INSERT INTO public.admin_permissions (permission_key, display_name, description, is_enabled, created_at)
SELECT 'feedback', 'Feedback Classification', 'Allow admins to classify and delete user feedback', true, now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.admin_permissions WHERE permission_key = 'feedback'
);

COMMIT;
