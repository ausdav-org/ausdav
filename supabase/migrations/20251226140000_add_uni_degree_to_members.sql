-- Add uni_degree column to members table
ALTER TABLE IF EXISTS members
ADD COLUMN IF NOT EXISTS uni_degree text;
