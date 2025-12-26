import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Shield, Users, DollarSign, Lock, Key, Loader2 } from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function AdminSettingsPage() {
  const { isSuperAdmin, user } = useAdminAuth();
  const [settings, setSettings] = useState<{ allow_signup: boolean; updated_at: string | null; updated_by: string | null; batch?: string | null } | null>(null);
  const [batchInput, setBatchInput] = useState<string>('');
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isSuperAdmin) return;

    const loadSettings = async () => {
      setSettingsError(null);
      const { data, error } = await supabase
        .from('app_settings')
        .select('allow_signup, updated_at, updated_by, batch')
        .eq('id', 1)
        .maybeSingle();

      if (error) {
        setSettingsError('Unable to load signup setting.');
      } else if (data) {
        setSettings(data);
        setBatchInput(data.batch ?? '');
      }

      setSettingsLoading(false);
    };

    loadSettings();
  }, [isSuperAdmin]);

  const toggleSignup = async () => {
    if (!settings || saving) return;

    setSaving(true);
    setSettingsError(null);

    const { data, error } = await supabase
      .from('app_settings')
      .update({
        allow_signup: !settings.allow_signup,
        updated_by: user?.id ?? null,
        // preserve batch unless changed via the batch editor
        batch: settings.batch ?? null,
      })
      .eq('id', 1)
      .select('allow_signup, updated_at, updated_by, batch')
      .maybeSingle();

    if (error) {
      setSettingsError(error.message);
    } else if (data) {
      setSettings(data);
    }

    setSaving(false);
  };

  const saveBatch = async () => {
    if (!settings || saving) return;
    setSaving(true);
    setSettingsError(null);

    const { data, error } = await supabase
      .from('app_settings')
      .update({
        batch: batchInput || null,
        updated_by: user?.id ?? null,
      })
      .eq('id', 1)
      .select('allow_signup, updated_at, updated_by, batch')
      .maybeSingle();

    if (error) {
      setSettingsError(error.message);
    } else if (data) {
      setSettings(data);
      setBatchInput(data.batch ?? '');
    }

    setSaving(false);
  };

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen">
        <AdminHeader title="Settings" breadcrumb="System" />
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full bg-card/50 backdrop-blur-sm border-border">
            <CardContent className="p-8 text-center">
              <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
              <p className="text-muted-foreground">
                System settings are only accessible to super administrators.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const rolePermissions = [
    {
      role: 'Super Admin',
      color: 'bg-red-500/20 text-red-400',
      permissions: [
        'Full system access',
        'Manage all users and roles',
        'View audit logs',
        'System settings',
        'All admin capabilities',
      ],
    },
    {
      role: 'Admin',
      color: 'bg-primary/20 text-primary',
      permissions: [
        'Dashboard access',
        'Manage members (limited)',
        'Verify finance submissions',
        'Manage content (events, announcements, exams)',
        'View finance ledger',
      ],
    },
    {
      role: 'Member',
      color: 'bg-green-500/20 text-green-400',
      permissions: [
        'View own profile',
        'Submit finance records (if enabled)',
        'View own submission history',
      ],
    },
    {
      role: 'Honourable',
      color: 'bg-yellow-500/20 text-yellow-400',
      permissions: [
        'View own profile',
        'Read-only access',
      ],
    },
  ];

  return (
    <div className="min-h-screen">
      <AdminHeader title="Settings" breadcrumb="System" />

      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-card/60 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Signup Access Control
              </CardTitle>
              <CardDescription>
                Toggle the visibility and enforcement of admin signups. When disabled, the Edge Function rejects new accounts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <Badge className={settings?.allow_signup ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'}>
                    {settingsLoading ? 'Checking...' : settings?.allow_signup ? 'Enabled' : 'Disabled'}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Hiding Sign Up is cosmetic unless this switch is ON. The Edge Function enforces the same gate server-side.
                  </p>
                  {settings?.updated_at && (
                    <p className="text-xs text-muted-foreground">
                      Last updated {new Date(settings.updated_at).toLocaleString()}
                    </p>
                  )}
                  {settingsError && (
                    <p className="text-sm text-destructive">{settingsError}</p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant={settings?.allow_signup ? 'destructive' : 'default'}
                    onClick={toggleSignup}
                    disabled={settingsLoading || saving || !settings}
                  >
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Updating...
                      </span>
                    ) : settings?.allow_signup ? 'Disable Sign Ups' : 'Enable Sign Ups'}
                  </Button>
                </div>
              </div>
              <div className="mt-4 border-t border-border pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div className="md:col-span-2">
                    <Label>Signup Batch (optional)</Label>
                    <Input
                      value={batchInput}
                      onChange={(e) => setBatchInput(e.target.value)}
                      placeholder="e.g. 2025"
                      className="bg-background/50"
                    />
                  </div>
                  <div className="flex items-center">
                    <Button onClick={saveBatch} disabled={settingsLoading || saving || !settings}>
                      {saving ? 'Saving...' : 'Save Batch'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-primary/10 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Shield className="h-8 w-8 text-primary shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg">Security Configuration</h3>
                  <p className="text-muted-foreground mt-1">
                    This admin portal uses JWT-based authentication with role-based access control.
                    All sensitive operations are logged in the audit system.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Badge className="bg-green-500/20 text-green-400">
                      <Lock className="h-3 w-3 mr-1" />
                      RLS Enabled
                    </Badge>
                    <Badge className="bg-green-500/20 text-green-400">
                      <Key className="h-3 w-3 mr-1" />
                      JWT Auth
                    </Badge>
                    <Badge className="bg-yellow-500/20 text-yellow-400">
                      MFA Recommended
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Role Permissions Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Role Permissions
              </CardTitle>
              <CardDescription>
                Overview of what each role can access in the admin portal.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rolePermissions.map((item) => (
                  <div
                    key={item.role}
                    className="p-4 bg-background/50 rounded-lg border border-border"
                  >
                    <Badge className={item.color}>{item.role}</Badge>
                    <ul className="mt-3 space-y-1">
                      {item.permissions.map((perm, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {perm}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* System Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                  <span className="text-muted-foreground">Account Creation</span>
                  <Badge>Invite Only</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                  <span className="text-muted-foreground">Default Role</span>
                  <Badge className="bg-green-500/20 text-green-400">Member</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                  <span className="text-muted-foreground">New Account Status</span>
                  <Badge className="bg-yellow-500/20 text-yellow-400">Inactive (requires activation)</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                  <span className="text-muted-foreground">MFA for Super Admin</span>
                  <Badge className="bg-primary/20 text-primary">Recommended</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Password Policy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Security Policies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-background/50 rounded-lg">
                  <p className="font-medium">Password Requirements</p>
                  <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                    <li>• Minimum 8 characters</li>
                    <li>• Must contain uppercase and lowercase letters</li>
                    <li>• Must contain at least one number</li>
                    <li>• Special characters recommended</li>
                  </ul>
                </div>
                <div className="p-3 bg-background/50 rounded-lg">
                  <p className="font-medium">Session Security</p>
                  <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                    <li>• JWT-based authentication</li>
                    <li>• Sessions expire after inactivity</li>
                    <li>• Re-authentication required for sensitive actions</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
