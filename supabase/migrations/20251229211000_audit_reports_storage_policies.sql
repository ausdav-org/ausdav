-- Create storage policies for audit-reports bucket
begin;

-- Ensure authenticated users can upload and list audit objects in the audit-reports bucket
drop policy if exists audit_reports_select on storage.objects;
create policy audit_reports_select
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'audit-reports');

drop policy if exists audit_reports_insert on storage.objects;
create policy audit_reports_insert
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'audit-reports');

drop policy if exists audit_reports_update on storage.objects;
create policy audit_reports_update
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'audit-reports')
  with check (bucket_id = 'audit-reports');

-- Keep objects private by default; do NOT grant anon select here.

commit;
