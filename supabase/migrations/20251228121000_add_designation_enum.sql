-- Add Postgres enum type for designations and a designation column on members
begin;

-- Create enum type (use machine-friendly values)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'designation_type') THEN
    CREATE TYPE public.designation_type AS ENUM (
      'president',
      'vice_president',
      'secretary',
      'vice_secretary',
      'treasurer',
      'assistant_treasurer',
      'editor',
      'web_designer',
      'general_committee_member',
      'education_committee_member',
      'university_representative'
    );
  END IF;
END$$;

-- Add enum column to members (nullable)
alter table if exists public.members
  add column if not exists designation public.designation_type;

-- If a previous FK column `designation_id` exists, drop its constraint and column
alter table if exists public.members drop constraint if exists members_designation_id_fkey;
alter table if exists public.members drop column if exists designation_id cascade;

commit;
