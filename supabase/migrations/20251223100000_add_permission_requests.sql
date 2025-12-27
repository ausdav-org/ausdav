-- Migration: Add permission requests and admin granted permissions
-- This allows admins to request permissions and super admins to grant/reject them

BEGIN;

--------------------------------------------------------------------------------
-- 1) Permission Requests Table
-- Stores permission requests from admins
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.permission_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_permission_requests_admin ON public.permission_requests(admin_id);
CREATE INDEX IF NOT EXISTS idx_permission_requests_status ON public.permission_requests(status);

-- Enable RLS
ALTER TABLE public.permission_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for permission_requests
-- Admins can view their own requests
CREATE POLICY "Admins can view own permission requests"
ON public.permission_requests FOR SELECT
USING (
  auth.uid() = admin_id
  OR EXISTS (
    SELECT 1 FROM public.members
    WHERE auth_user_id = auth.uid()
    AND role = 'super_admin'
  )
);

-- Admins can create their own requests
CREATE POLICY "Admins can create permission requests"
ON public.permission_requests FOR INSERT
WITH CHECK (
  auth.uid() = admin_id
  AND EXISTS (
    SELECT 1 FROM public.members
    WHERE auth_user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Super admins can update any request (to approve/reject)
CREATE POLICY "Super admins can update permission requests"
ON public.permission_requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.members
    WHERE auth_user_id = auth.uid()
    AND role = 'super_admin'
  )
);

--------------------------------------------------------------------------------
-- 2) Admin Granted Permissions Table
-- Stores which permissions are granted to each admin
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.admin_granted_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL,
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(admin_id, permission_key)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_granted_permissions_admin ON public.admin_granted_permissions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_granted_permissions_active ON public.admin_granted_permissions(is_active);

-- Enable RLS
ALTER TABLE public.admin_granted_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_granted_permissions
-- Admins can view their own granted permissions
CREATE POLICY "Admins can view own granted permissions"
ON public.admin_granted_permissions FOR SELECT
USING (
  auth.uid() = admin_id
  OR EXISTS (
    SELECT 1 FROM public.members
    WHERE auth_user_id = auth.uid()
    AND role = 'super_admin'
  )
);

-- Super admins can insert/update/delete permissions
CREATE POLICY "Super admins can manage granted permissions"
ON public.admin_granted_permissions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.members
    WHERE auth_user_id = auth.uid()
    AND role = 'super_admin'
  )
);

--------------------------------------------------------------------------------
-- 3) Admin Notifications Table
-- Stores notifications for admins (permission approvals/rejections)
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('permission_approved', 'permission_rejected', 'permission_revoked', 'permission_granted', 'info')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_permission TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_notifications_admin ON public.admin_notifications(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_unread ON public.admin_notifications(admin_id, is_read) WHERE is_read = false;

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_notifications
-- Admins can view their own notifications
CREATE POLICY "Admins can view own notifications"
ON public.admin_notifications FOR SELECT
USING (auth.uid() = admin_id);

-- Admins can update their own notifications (mark as read)
CREATE POLICY "Admins can update own notifications"
ON public.admin_notifications FOR UPDATE
USING (auth.uid() = admin_id);

-- Super admins can insert notifications for any admin
CREATE POLICY "Super admins can create notifications"
ON public.admin_notifications FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.members
    WHERE auth_user_id = auth.uid()
    AND role = 'super_admin'
  )
);

--------------------------------------------------------------------------------
-- 4) Trigger to update updated_at on permission_requests
--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_permission_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_permission_requests_updated_at ON public.permission_requests;
CREATE TRIGGER trigger_permission_requests_updated_at
  BEFORE UPDATE ON public.permission_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_permission_requests_updated_at();

COMMIT;
