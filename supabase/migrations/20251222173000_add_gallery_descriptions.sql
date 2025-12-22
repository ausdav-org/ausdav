begin;

--------------------------------------------------------------------------------
-- Add Tamil and English descriptions to galleries
--------------------------------------------------------------------------------

alter table public.galleries
  add column if not exists description_en text,
  add column if not exists description_ta text;

--------------------------------------------------------------------------------
-- Update RLS policies (descriptions are public)
--------------------------------------------------------------------------------
-- No changes needed to policies as they already allow public read

commit;