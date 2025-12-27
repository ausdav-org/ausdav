-- Add Tamil language support to announcements table
-- Rename existing title/description to English versions and add Tamil columns
-- Safe to run multiple times; uses IF EXISTS/DO NOTHING patterns.

begin;

-- Rename legacy columns to match new schema (English versions)
alter table public.announcements
  rename column title to title_en;

alter table public.announcements
  rename column description to description_en;

-- Add Tamil language columns
alter table public.announcements
  add column if not exists title_ta text null,
  add column if not exists description_ta text null;

commit;