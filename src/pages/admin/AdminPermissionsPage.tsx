import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldCheck, ShieldX, Loader2, AlertTriangle } from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const AdminPermissionsPage: React.FC = () => {
  const { isSuperAdmin } = useAdminAuth();
  const { permissions, loading, togglePermission } = useAdminPermissions();

  if (!isSuperAdmin) {
    return (
      <div className="p-6">
        <AdminHeader title="Permission Management" breadcrumb="Settings / Permissions" />
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <ShieldX className="w-16 h-16 text-destructive mb-4" />
          <h2 className="text-xl font-bold mb-2">Access Restricted</h2>
          <p className="text-muted-foreground">
            Only Super Administrators can manage permissions.
          </p>
        </div>
      </div>
    );
  }

  const handleToggle = async (permissionKey: string, currentValue: boolean) => {
    const success = await togglePermission(permissionKey, !currentValue);
    if (success) {
      toast.success(`Permission ${!currentValue ? 'enabled' : 'disabled'} successfully`);
    } else {
      toast.error('Failed to update permission');
    }
  };

  const getPermissionIcon = (key: string) => {
    const icons: Record<string, string> = {
      finance_approval: '💰',
      member_management: '👥',
      announcements: '📢',
      events_management: '📅',
      exam_management: '📝',
      seminar_management: '🎓',
    };
    return icons[key] || '⚙️';
  };

  return (
    <div className="p-6 space-y-6">
      <AdminHeader title="Permission Management" breadcrumb="Settings / Permissions" />
      
      {/* Info Banner */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex items-start gap-4 p-4">
          <AlertTriangle className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium">Admin Permission Control</p>
            <p className="text-sm text-muted-foreground">
              Use these toggles to enable or disable specific actions for Admin users. 
              Super Admins always have full access regardless of these settings.
            </p>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {permissions.map((permission, index) => (
            <motion.div
              key={permission.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={permission.is_enabled ? 'border-green-500/30' : 'border-border/50'}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getPermissionIcon(permission.permission_key)}</span>
                      <div>
                        <CardTitle className="text-base">{permission.display_name}</CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                          {permission.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge 
                      variant={permission.is_enabled ? 'default' : 'secondary'}
                      className={permission.is_enabled ? 'bg-green-500' : ''}
                    >
                      {permission.is_enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      {permission.is_enabled ? (
                        <ShieldCheck className="w-4 h-4 text-green-500" />
                      ) : (
                        <ShieldX className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="text-sm">
                        {permission.is_enabled 
                          ? 'Admins can perform this action' 
                          : 'Only Super Admins can perform this action'}
                      </span>
                    </div>
                    <Switch
                      checked={permission.is_enabled}
                      onCheckedChange={() => handleToggle(permission.permission_key, permission.is_enabled)}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Permission Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-green-500/10">
              <p className="text-2xl font-bold text-green-500">
                {permissions.filter(p => p.is_enabled).length}
              </p>
              <p className="text-sm text-muted-foreground">Enabled</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted">
              <p className="text-2xl font-bold text-muted-foreground">
                {permissions.filter(p => !p.is_enabled).length}
              </p>
              <p className="text-sm text-muted-foreground">Disabled</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-primary/10">
              <p className="text-2xl font-bold text-primary">
                {permissions.length}
              </p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPermissionsPage;
