-- Create audit_actions table for storing audit PDF references
-- Fields: id, year, event, storage bucket and object path, filename, uploader, timestamps
begin;

create table if not exists public.audit_actions (
  id bigserial primary key,
  year integer not null,
  event text not null,
  bucket_id text not null,
  object_path text not null,
  file_name text,
  file_size bigint,
  uploaded_by uuid,
  created_at timestamptz default now()
);

create index if not exists audit_actions_year_idx on public.audit_actions(year);

-- Grant database-level permissions for authenticated users to insert/select
grant select, insert, update on public.audit_actions to authenticated;

commit;
