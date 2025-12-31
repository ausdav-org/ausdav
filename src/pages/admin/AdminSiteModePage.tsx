import React, { useEffect, useState } from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type AppSettings = {
  id: number;
  site_under_construction?: boolean | null;
  restrict_public_access?: boolean | null;
  allow_signup_when_construction?: boolean | null;
  show_maintenance_countdown?: boolean | null;
  allow_admin_login?: boolean | null;
  show_under_construction_banner?: boolean | null;
  updated_at?: string | null;
};

export default function AdminSiteModePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings' as any)
          .select('*')
          .eq('id', 1)
          .maybeSingle<AppSettings>();

        if (error) throw error;
        if (!active) return;
        setSettings(data ?? { id: 1 });
      } catch (err) {
        console.error('Failed to load app settings', err);
        toast.error('Unable to load settings');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const updateSetting = (key: keyof AppSettings, value: boolean) => {
    setSettings((s) => (s ? { ...s, [key]: value } : { id: 1, [key]: value } as any));
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const payload = {
        id: 1,
        site_under_construction: !!settings.site_under_construction,
        restrict_public_access: !!settings.restrict_public_access,
        allow_signup_when_construction: !!settings.allow_signup_when_construction,
        show_maintenance_countdown: !!settings.show_maintenance_countdown,
        allow_admin_login: !!settings.allow_admin_login,
        show_under_construction_banner: !!settings.show_under_construction_banner,
      };

      const res: any = await (supabase as any)
        .from('app_settings')
        .upsert(payload, { returning: 'representation', onConflict: 'id' })
        .select()
        .maybeSingle();

      const data = res?.data;
      const err = res?.error;
      if (err) throw err;
      toast.success('Settings saved');
      if (data) setSettings((s) => (s ? { ...s, updated_at: data.updated_at ?? new Date().toISOString() } : s));
    } catch (err) {
      console.error('Failed to save settings', err);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <AdminHeader title="Site Mode" />
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Under Construction Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Under Construction Mode</Label>
                  <div className="text-sm text-muted-foreground">When enabled, public pages will show the under construction page.</div>
                </div>
                <Switch
                  checked={Boolean(settings?.site_under_construction)}
                  onCheckedChange={(v) => updateSetting('site_under_construction', Boolean(v))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Restrict Public Access</Label>
                  <div className="text-sm text-muted-foreground">Block non-admin users from accessing most pages.</div>
                </div>
                <Switch
                  checked={Boolean(settings?.restrict_public_access)}
                  onCheckedChange={(v) => updateSetting('restrict_public_access', Boolean(v))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Allow Signups</Label>
                  <div className="text-sm text-muted-foreground">Allow new users to sign up while in construction mode.</div>
                </div>
                <Switch
                  checked={Boolean(settings?.allow_signup_when_construction)}
                  onCheckedChange={(v) => updateSetting('allow_signup_when_construction', Boolean(v))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Maintenance Countdown</Label>
                  <div className="text-sm text-muted-foreground">Display a countdown timer on the under construction page.</div>
                </div>
                <Switch
                  checked={Boolean(settings?.show_maintenance_countdown)}
                  onCheckedChange={(v) => updateSetting('show_maintenance_countdown', Boolean(v))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Allow Admin Login</Label>
                  <div className="text-sm text-muted-foreground">Allow admin users to sign in while site is under construction.</div>
                </div>
                <Switch
                  checked={Boolean(settings?.allow_admin_login)}
                  onCheckedChange={(v) => updateSetting('allow_admin_login', Boolean(v))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Banner</Label>
                  <div className="text-sm text-muted-foreground">Show a small banner on top of pages indicating maintenance mode.</div>
                </div>
                <Switch
                  checked={Boolean(settings?.show_under_construction_banner)}
                  onCheckedChange={(v) => updateSetting('show_under_construction_banner', Boolean(v))}
                />
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <Button onClick={handleSave} disabled={saving || loading}>
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
