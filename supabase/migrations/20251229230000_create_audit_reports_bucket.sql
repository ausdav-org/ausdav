-- Create audit-reports storage bucket (idempotent)
begin;

-- Insert the audit-reports bucket (private by default)
insert into storage.buckets (id, name, public)
values ('audit-reports', 'audit-reports', false)
on conflict (id) do update
set name   = excluded.name,
    public = excluded.public;

-- Ensure authenticated role can SELECT storage.objects (idempotent elsewhere)
grant select on storage.objects to authenticated;

commit;
