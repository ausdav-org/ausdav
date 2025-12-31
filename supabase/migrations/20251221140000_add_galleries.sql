-- Create galleries and gallery_images tables for event galleries
begin;

-- galleries table
create table if not exists public.galleries (
  id uuid default gen_random_uuid() primary key,
  year integer not null unique,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- gallery_images table
create table if not exists public.gallery_images (
  id uuid default gen_random_uuid() primary key,
  gallery_id uuid not null references public.galleries(id) on delete cascade,
  image_path text not null,
  created_at timestamptz not null default now()
);

-- Create galleries storage bucket
insert into storage.buckets (id, name, public)
values ('galleries', 'galleries', true)
on conflict (id) do nothing;

-- Public read for gallery images
drop policy if exists galleries_assets_read on storage.objects;
create policy galleries_assets_read
on storage.objects
for select
using ( bucket_id = 'galleries' );

-- Authenticated upload/update/delete limited to galleries bucket
drop policy if exists galleries_assets_insert on storage.objects;
create policy galleries_assets_insert
on storage.objects
for insert
to authenticated
with check ( bucket_id = 'galleries' );

drop policy if exists galleries_assets_update on storage.objects;
create policy galleries_assets_update
on storage.objects
for update
to authenticated
using ( bucket_id = 'galleries' );

drop policy if exists galleries_assets_delete on storage.objects;
create policy galleries_assets_delete
on storage.objects
for delete
to authenticated
using ( bucket_id = 'galleries' );

-- RLS for galleries
alter table public.galleries enable row level security;
drop policy if exists galleries_read on public.galleries;
create policy galleries_read
on public.galleries
for select
using (true);

drop policy if exists galleries_insert on public.galleries;
create policy galleries_insert
on public.galleries
for insert
to authenticated
with check (true);

drop policy if exists galleries_update on public.galleries;
create policy galleries_update
on public.galleries
for update
to authenticated
using (true);

drop policy if exists galleries_delete on public.galleries;
create policy galleries_delete
on public.galleries
for delete
to authenticated
using (true);

-- RLS for gallery_images
alter table public.gallery_images enable row level security;
drop policy if exists gallery_images_read on public.gallery_images;
create policy gallery_images_read
on public.gallery_images
for select
using (true);

drop policy if exists gallery_images_insert on public.gallery_images;
create policy gallery_images_insert
on public.gallery_images
for insert
to authenticated
with check (true);

drop policy if exists gallery_images_delete on public.gallery_images;
create policy gallery_images_delete
on public.gallery_images
for delete
to authenticated
using (true);

commit;