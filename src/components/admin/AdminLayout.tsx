import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { AdminSidebar } from './AdminSidebar';
import { Loader2 } from 'lucide-react';

export function AdminLayout() {
  const { user, profile, role, loading, needsProfileSetup } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login');
        return;
      }
      if (!profile) {
        navigate('/admin/profile-setup');
        return;
      }
    }
  }, [user, profile, role, loading, navigate, needsProfileSetup]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Allow the profile setup route to render even when profile is missing.
  const isProfileSetupRoute = location.pathname.endsWith('/admin/profile-setup');

  if (!user || (!profile && !isProfileSetupRoute)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <main className="pl-16 lg:pl-60 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
