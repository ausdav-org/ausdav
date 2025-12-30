-- Migration: create feedback table
-- Adds a table for user feedback messages

CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  type TEXT NULL CHECK (type IN ('positive', 'negative')),
  client_ip TEXT NULL,
  user_agent TEXT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes to support common queries
CREATE INDEX IF NOT EXISTS feedback_type_idx ON public.feedback (type);
CREATE INDEX IF NOT EXISTS feedback_is_read_idx ON public.feedback (is_read);
CREATE INDEX IF NOT EXISTS feedback_created_idx ON public.feedback (created_at);
