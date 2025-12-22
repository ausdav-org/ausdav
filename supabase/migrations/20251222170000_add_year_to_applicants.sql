-- Add year column to applicants table
alter table public.applicants
add column year integer not null default extract(year from now());

-- Update existing records to set year from created_at
update public.applicants
set year = extract(year from created_at)::integer
where year is null;