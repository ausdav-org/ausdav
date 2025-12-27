-- Migration: Add patrons table
-- Created: 2025-12-27

create table if not exists public.patrons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  designation text,
  -- store one or more bucket paths for patron images
  image_paths text[] default ARRAY[]::text[],
  created_at timestamptz not null default now()
);

-- GIN index for fast lookup/search on image_paths array
create index if not exists patrons_image_paths_idx on public.patrons using gin (image_paths);

comment on table public.patrons is 'Patrons for site (name, designation, image bucket paths)';
