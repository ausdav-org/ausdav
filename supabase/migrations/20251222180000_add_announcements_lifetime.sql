-- Migration: add lifetime and active flags to announcements
-- Adds: is_active, start_at, end_at, is_permanent

BEGIN;

ALTER TABLE announcements
  ADD COLUMN is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN start_at timestamptz DEFAULT NULL,
  ADD COLUMN end_at timestamptz DEFAULT NULL,
  ADD COLUMN is_permanent boolean NOT NULL DEFAULT false;

-- Ensure that permanent announcements do not have an end timestamp
ALTER TABLE announcements
  ADD CONSTRAINT announcements_permanent_end_null CHECK (NOT is_permanent OR end_at IS NULL);

-- Ensure end is after start when both present
ALTER TABLE announcements
  ADD CONSTRAINT announcements_start_end_logic CHECK (end_at IS NULL OR start_at IS NULL OR end_at > start_at);

-- Index to efficiently query currently active announcements
CREATE INDEX IF NOT EXISTS idx_announcements_active_schedule ON announcements (is_active, start_at, end_at);

COMMIT;
