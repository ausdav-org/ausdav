-- Allow admins (not only super-admins) to toggle exam applications flag
-- This policy permits authenticated users with the 'applicant' admin permission
-- (or super-admins) to update the `allow_exam_applications` column on app_settings.

drop policy if exists "admins can update exam app setting" on public.app_settings;
create policy "admins can update exam app setting"
  on public.app_settings
  for update
  to authenticated
  using ( private.is_super_admin() or private.has_permission('applicant') )
  with check ( private.is_super_admin() or private.has_permission('applicant') );

-- Note: existing stricter policies (e.g. super-admin-only update) remain; policy order
-- is not guaranteed, but having this policy ensures members with the 'applicant'
-- admin permission can perform updates when RLS evaluates allowed expressions.
