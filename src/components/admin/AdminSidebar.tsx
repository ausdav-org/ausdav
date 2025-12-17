import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Receipt,
  FileText,
  CheckSquare,
  CalendarDays,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Megaphone,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Button } from '@/components/ui/button';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
}

const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, roles: ['admin', 'super_admin'] },
  { title: 'Profile', href: '/admin/profile', icon: User, roles: ['member', 'honourable', 'admin', 'super_admin'] },
  { title: 'Members', href: '/admin/members', icon: Users, roles: ['admin', 'super_admin'] },
  { title: 'Events', href: '/admin/events', icon: CalendarDays, roles: ['admin', 'super_admin'] },
  { title: 'Submit Finance', href: '/admin/finance/submit', icon: Receipt, roles: ['member'] },
  { title: 'Verify Finance', href: '/admin/finance/verify', icon: CheckSquare, roles: ['admin', 'super_admin'] },
  { title: 'Finance Ledger', href: '/admin/finance/ledger', icon: DollarSign, roles: ['admin', 'super_admin'] },
  { title: 'Announcements', href: '/admin/announcements', icon: Megaphone, roles: ['admin', 'super_admin'] },
  { title: 'Permissions', href: '/admin/permissions', icon: Shield, roles: ['super_admin'] },
  { title: 'Audit Log', href: '/admin/audit', icon: FileText, roles: ['super_admin'] },
  { title: 'Settings', href: '/admin/settings', icon: Settings, roles: ['super_admin'] },
];

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { role, profile } = useAdminAuth();

  const filteredNavItems = navItems.filter((item) => {
    if (!role) return false;
    // Special case: member can only see finance submit if enabled
    if (item.href === '/admin/finance/submit' && role === 'member') {
      return profile?.can_submit_finance;
    }
    return item.roles.includes(role);
  });

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 240 }}
      className="fixed left-0 top-0 z-40 h-screen bg-card/80 backdrop-blur-xl border-r border-border flex flex-col"
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">A</span>
              </div>
              <span className="font-semibold text-foreground">AUSDAV Admin</span>
            </motion.div>
          )}
        </AnimatePresence>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <li key={item.href}>
                <NavLink
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                    'hover:bg-secondary/80',
                    isActive && 'bg-primary/10 text-primary border border-primary/20 neon-glow'
                  )}
                >
                  <item.icon className={cn('h-5 w-5 shrink-0', isActive && 'text-primary')} />
                  <AnimatePresence mode="wait">
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="text-sm font-medium whitespace-nowrap"
                      >
                        {item.title}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Role Badge */}
      <div className="p-4 border-t border-border">
        <AnimatePresence mode="wait">
          {!collapsed && role && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className={cn(
                'px-2 py-1 rounded-md text-xs font-medium capitalize',
                role === 'super_admin' && 'bg-red-500/20 text-red-400',
                role === 'admin' && 'bg-primary/20 text-primary',
                role === 'member' && 'bg-green-500/20 text-green-400',
                role === 'honourable' && 'bg-yellow-500/20 text-yellow-400'
              )}>
                {role.replace('_', ' ')}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}
