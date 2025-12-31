-- Migration: Add extra columns to patrons
-- Created: 2025-12-27

alter table if exists public.patrons
  add column if not exists bio text,
  add column if not exists display_order integer not null default 0,
  add column if not exists is_active boolean not null default true,
  add column if not exists image_alt text;

-- Optional index to quickly find active patrons in display order
create index if not exists patrons_active_order_idx on public.patrons (is_active, display_order);
