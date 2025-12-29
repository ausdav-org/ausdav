-- Set designation default to null for members table
ALTER TABLE public.members ALTER COLUMN designation DROP NOT NULL;
ALTER TABLE public.members ALTER COLUMN designation SET DEFAULT NULL;