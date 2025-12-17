import { useNavigate } from 'react-router-dom';
import { LogOut, User, Shield, ChevronDown } from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import LiveViewerBadge from '@/components/LiveViewerBadge';

interface AdminHeaderProps {
  title: string;
  breadcrumb?: string;
}

export function AdminHeader({ title, breadcrumb }: AdminHeaderProps) {
  const { profile, role, signOut } = useAdminAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <header className="h-16 bg-card/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-6">
      {/* Page Title */}
      <div>
        {breadcrumb && (
          <p className="text-xs text-muted-foreground mb-0.5">{breadcrumb}</p>
        )}
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      </div>

      {/* Live Viewer Badge & Profile Menu */}
      <div className="flex items-center gap-4">
        <LiveViewerBadge size="sm" />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-3 px-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium">{profile?.full_name || 'User'}</p>
              <p className={cn(
                'text-xs capitalize',
                role === 'super_admin' && 'text-red-400',
                role === 'admin' && 'text-primary',
                role === 'member' && 'text-green-400',
                role === 'honourable' && 'text-yellow-400'
              )}>
                {role?.replace('_', ' ') || 'Loading...'}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => navigate('/admin/profile')}>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/admin/profile')}>
            <Shield className="mr-2 h-4 w-4" />
            Security
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
