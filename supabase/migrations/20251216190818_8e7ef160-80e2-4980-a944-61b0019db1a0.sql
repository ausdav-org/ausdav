-- Create admin_permissions table for super admin to control admin actions
CREATE TABLE public.admin_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  permission_key text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  is_enabled boolean NOT NULL DEFAULT false,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage permissions
CREATE POLICY "Super admins can manage permissions"
ON public.admin_permissions
FOR ALL
USING (has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- All authenticated users can view permissions (to check if feature is enabled)
CREATE POLICY "Authenticated users can view permissions"
ON public.admin_permissions
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Insert default permissions
INSERT INTO public.admin_permissions (permission_key, display_name, description, is_enabled) VALUES
('finance_approval', 'Finance Approval', 'Allow admins to approve/reject finance submissions', false),
('member_management', 'Member Management', 'Allow admins to activate/deactivate members', false),
('announcements', 'Announcements Management', 'Allow admins to create/edit announcements', false),
('events_management', 'Events Management', 'Allow admins to manage events', false),
('exam_management', 'Exam Management', 'Allow admins to manage exam data', false),
('seminar_management', 'Seminar Management', 'Allow admins to manage seminars', false);

-- Create trigger for updated_at
CREATE TRIGGER update_admin_permissions_updated_at
BEFORE UPDATE ON public.admin_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for presence tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;