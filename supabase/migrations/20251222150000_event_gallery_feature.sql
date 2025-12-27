begin;

--------------------------------------------------------------------------------
-- Event galleries (safe re-run)
--------------------------------------------------------------------------------
create extension if not exists "pgcrypto";

--------------------------------------------------------------------------------
-- Base tables (idempotent definitions for fresh environments)
--------------------------------------------------------------------------------
create table if not exists public.galleries (
  id uuid primary key default gen_random_uuid(),
  event_id integer not null references public.events(id) on delete cascade,
  year smallint not null,
  title text null,
  max_images integer not null default 100,
  created_at timestamptz not null default now(),
  created_by uuid null references auth.users(id) on delete set null
);

create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.galleries(id) on delete cascade,
  file_path text not null,
  caption text null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  created_by uuid null references auth.users(id) on delete set null
);

--------------------------------------------------------------------------------
-- Migrate/align existing structure (non-destructive)
--------------------------------------------------------------------------------
-- galleries: add missing columns
alter table public.galleries
  add column if not exists event_id integer,
  add column if not exists max_images integer,
  add column if not exists created_by uuid,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists title text;

-- FK for event_id (recreate safely)
alter table public.galleries drop constraint if exists galleries_event_id_fkey;
alter table public.galleries
  add constraint galleries_event_id_fkey
  foreign key (event_id) references public.events(id) on delete cascade;

-- tighten year type/range
alter table public.galleries
  alter column year type smallint using year::smallint;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'galleries_year_range_check') then
    alter table public.galleries
      add constraint galleries_year_range_check check (year between 1900 and 2100);
  end if;
end;
$$;

-- allow nullable title
alter table public.galleries
  alter column title drop not null;

-- normalize max_images
update public.galleries set max_images = 100 where max_images is null;
alter table public.galleries
  alter column max_images set not null,
  alter column max_images set default 100;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'galleries_max_images_range_check') then
    alter table public.galleries
      add constraint galleries_max_images_range_check check (max_images between 1 and 100);
  end if;
end;
$$;

-- created_by FK
alter table public.galleries drop constraint if exists galleries_created_by_fkey;
alter table public.galleries
  add constraint galleries_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null;

-- unique per event + year (drop this index to allow multiple galleries per year)
create unique index if not exists galleries_event_year_uniq on public.galleries(event_id, year);
create index if not exists galleries_event_idx on public.galleries(event_id);

-- set event_id not null only when data already filled
-- (avoids failing on legacy rows without event linkage)
do $$
begin
  if not exists (select 1 from public.galleries where event_id is null) then
    alter table public.galleries alter column event_id set not null;
  end if;
end;
$$;

-- keep updated_at trigger if column exists
-- (older schema had updated_at; reuse generic updater)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'galleries' and column_name = 'updated_at'
  ) then
    drop trigger if exists set_updated_at_galleries on public.galleries;
    create trigger set_updated_at_galleries
    before update on public.galleries
    for each row execute function private.tg_set_updated_at();
  end if;
end;
$$;

--------------------------------------------------------------------------------
-- gallery_images alignment
--------------------------------------------------------------------------------
alter table public.gallery_images
  add column if not exists caption text,
  add column if not exists sort_order integer,
  add column if not exists created_by uuid;

alter table public.gallery_images
  alter column sort_order set default 0;
update public.gallery_images set sort_order = 0 where sort_order is null;

-- rename legacy image_path -> file_path if present
-- (keeps data then drops old column)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'gallery_images' and column_name = 'image_path'
  ) then
    alter table public.gallery_images add column if not exists file_path text;
    update public.gallery_images
      set file_path = coalesce(file_path, image_path)
      where file_path is null;
    alter table public.gallery_images drop column image_path;
  end if;
end;
$$;

alter table public.gallery_images add column if not exists file_path text;

do $$
begin
  if not exists (select 1 from public.gallery_images where file_path is null) then
    alter table public.gallery_images alter column file_path set not null;
  end if;
end;
$$;

alter table public.gallery_images drop constraint if exists gallery_images_gallery_id_fkey;
alter table public.gallery_images
  add constraint gallery_images_gallery_id_fkey
  foreign key (gallery_id) references public.galleries(id) on delete cascade;

alter table public.gallery_images drop constraint if exists gallery_images_created_by_fkey;
alter table public.gallery_images
  add constraint gallery_images_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null;

create unique index if not exists gallery_images_gallery_id_file_path_uniq
  on public.gallery_images(gallery_id, file_path);
create index if not exists gallery_images_gallery_idx on public.gallery_images(gallery_id);
create index if not exists gallery_images_sort_idx on public.gallery_images(gallery_id, sort_order);

--------------------------------------------------------------------------------
-- created_by automation (matches repository patterns: auth.uid on insert)
--------------------------------------------------------------------------------
create or replace function private.tg_set_created_by_if_null()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.created_by is null then
    new.created_by := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists galleries_set_created_by on public.galleries;
create trigger galleries_set_created_by
before insert on public.galleries
for each row execute function private.tg_set_created_by_if_null();

drop trigger if exists gallery_images_set_created_by on public.gallery_images;
create trigger gallery_images_set_created_by
before insert on public.gallery_images
for each row execute function private.tg_set_created_by_if_null();

--------------------------------------------------------------------------------
-- Image limit enforcement (per-gallery cap)
--------------------------------------------------------------------------------
create or replace function public.enforce_gallery_image_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_max integer;
  v_count integer;
begin
  select g.max_images into v_max
  from public.galleries g
  where g.id = new.gallery_id
  for update;

  if v_max is null then
    raise exception 'gallery % not found or missing max_images', new.gallery_id;
  end if;

  select count(*) into v_count
  from public.gallery_images gi
  where gi.gallery_id = new.gallery_id;

  if v_count >= v_max then
    raise exception 'image limit reached (% max) for gallery %', v_max, new.gallery_id;
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_gallery_image_limit on public.gallery_images;
create trigger enforce_gallery_image_limit
before insert on public.gallery_images
for each row execute function public.enforce_gallery_image_limit();

--------------------------------------------------------------------------------
-- RLS: public read; writes limited to super admin or events permission
--------------------------------------------------------------------------------
alter table public.galleries enable row level security;
alter table public.gallery_images enable row level security;

-- galleries policies
drop policy if exists galleries_read on public.galleries;
drop policy if exists galleries_insert on public.galleries;
drop policy if exists galleries_update on public.galleries;
drop policy if exists galleries_delete on public.galleries;
drop policy if exists galleries_read_public on public.galleries;
drop policy if exists galleries_manage_admin on public.galleries;

create policy galleries_read_public
on public.galleries
for select
to anon, authenticated
using (true);

create policy galleries_manage_admin
on public.galleries
for all
to authenticated
using ( private.is_super_admin() or private.has_permission('events') )
with check ( private.is_super_admin() or private.has_permission('events') );

-- gallery_images policies
drop policy if exists gallery_images_read on public.gallery_images;
drop policy if exists gallery_images_insert on public.gallery_images;
drop policy if exists gallery_images_delete on public.gallery_images;
drop policy if exists gallery_images_read_public on public.gallery_images;
drop policy if exists gallery_images_manage_admin on public.gallery_images;

create policy gallery_images_read_public
on public.gallery_images
for select
to anon, authenticated
using (true);

create policy gallery_images_manage_admin
on public.gallery_images
for all
to authenticated
using ( private.is_super_admin() or private.has_permission('events') )
with check ( private.is_super_admin() or private.has_permission('events') );

--------------------------------------------------------------------------------
-- Storage policies for event-gallery bucket (public read; admin writes)
--------------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('event-gallery', 'event-gallery', true)
on conflict (id) do update
set name = excluded.name,
    public = excluded.public;

drop policy if exists event_gallery_assets_read on storage.objects;
create policy event_gallery_assets_read
on storage.objects
for select
to anon, authenticated
using ( bucket_id = 'event-gallery' );

drop policy if exists event_gallery_assets_insert on storage.objects;
create policy event_gallery_assets_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'event-gallery'
  and (private.is_super_admin() or private.has_permission('events'))
);

drop policy if exists event_gallery_assets_update on storage.objects;
create policy event_gallery_assets_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'event-gallery'
  and (private.is_super_admin() or private.has_permission('events'))
)
with check (
  bucket_id = 'event-gallery'
  and (private.is_super_admin() or private.has_permission('events'))
);

drop policy if exists event_gallery_assets_delete on storage.objects;
create policy event_gallery_assets_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'event-gallery'
  and (private.is_super_admin() or private.has_permission('events'))
);

commit;