-- Align events table with current admin form (image upload, optional date/location) and add storage bucket
-- Safe to run multiple times; uses IF EXISTS/DO NOTHING patterns.

begin;

-- Rename legacy columns to match new schema
alter table public.events
  rename column eve_id to id;

alter table public.events
  rename column title to title_en;

alter table public.events
  rename column description to description_en;

-- Add new columns
alter table public.events
  add column if not exists title_ta text null,
  add column if not exists description_ta text null,
  add column if not exists event_date date not null default current_date,
  add column if not exists location text null,
  add column if not exists is_active boolean not null default true,
  add column if not exists created_by uuid null,
  add column if not exists image_bucket text not null default 'events',
  add column if not exists image_path text null;

-- Ensure event_date exists (with a safe default) and remove legacy year column if present
alter table public.events
  drop column if exists year;

-- Create events storage bucket if missing
insert into storage.buckets (id, name, public)
values ('events', 'events', true)
on conflict (id) do nothing;

-- Public read for event images
drop policy if exists events_assets_read on storage.objects;
create policy events_assets_read
on storage.objects
for select
using ( bucket_id = 'events' );

-- Authenticated upload/update/delete limited to events bucket
drop policy if exists events_assets_insert on storage.objects;
create policy events_assets_insert
on storage.objects
for insert
to authenticated
with check ( bucket_id = 'events' );

drop policy if exists events_assets_update on storage.objects;
create policy events_assets_update
on storage.objects
for update
to authenticated
using ( bucket_id = 'events' )
with check ( bucket_id = 'events' );

drop policy if exists events_assets_delete on storage.objects;
create policy events_assets_delete
on storage.objects
for delete
to authenticated
using ( bucket_id = 'events' );

commit;
