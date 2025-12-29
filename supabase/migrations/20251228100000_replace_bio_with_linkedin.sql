-- Migration: Replace bio with linkedin_id on patrons
-- Created: 2025-12-28

alter table if exists public.patrons
  drop column if exists bio,
  add column if not exists linkedin_id text;

-- No change to existing indexes
