import React, { useEffect, useState, useCallback } from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAdminGrantedPermissions } from '@/hooks/useAdminGrantedPermissions';
import { toast } from '@/hooks/use-toast';

const db = supabase as any;

export default function AdminFeedbackPage() {
  const { isAdmin, isSuperAdmin } = useAdminAuth();
  const { hasPermission, loading: permsLoading } = useAdminGrantedPermissions();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await db
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setFeedbacks(data || []);
    } catch (err) {
      console.error('Error fetching feedback:', err);
      toast({ title: 'Error', description: 'Could not load feedback' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only admins and super admins may view
    if (!isAdmin && !isSuperAdmin) return;
    fetchFeedback();
  }, [isAdmin, isSuperAdmin, fetchFeedback]);

  const classify = async (id: string, type: 'positive' | 'negative') => {
    // Only super admin or those granted the permission may classify
    if (!isSuperAdmin && !hasPermission('feedback')) {
      toast({ title: 'Permission denied', description: 'Only Super Admins can classify feedback' });
      return;
    }

    try {
      const { error } = await db
        .from('feedback')
        .update({ type, is_read: true })
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Feedback classified' });
      fetchFeedback();
    } catch (err) {
      console.error('Error classifying feedback:', err);
      toast({ title: 'Error', description: 'Classification failed' });
    }
  };

  const unread = feedbacks.filter((f) => f.type == null);
  const read = feedbacks.filter((f) => f.type != null);

  return (
    <div className="min-h-screen">
      <AdminHeader title="Feedback" breadcrumb="Admin / Feedback" />
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <Card className="bg-card/50 backdrop-blur-sm border-border">
          <CardHeader>
            <CardTitle>Unread (Unclassified)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground">Loading...</p>
            ) : unread.length === 0 ? (
              <p className="text-center text-muted-foreground">No unread feedback</p>
            ) : (
              <div className="space-y-4">
                {unread.map((f) => (
                  <div key={f.id} className="p-4 border rounded-lg flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{new Date(f.created_at).toLocaleString()}</p>
                      <p className="mt-1">{f.message}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button size="sm" onClick={() => classify(f.id, 'positive')}>Positive</Button>
                      <Button size="sm" variant="outline" onClick={() => classify(f.id, 'negative')}>Negative</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border">
          <CardHeader>
            <CardTitle>All feedback</CardTitle>
          </CardHeader>
          <CardContent>
            {read.length === 0 ? (
              <p className="text-center text-muted-foreground">No classified feedback</p>
            ) : (
              <div className="space-y-3">
                {read.map((f) => (
                  <div key={f.id} className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground">{new Date(f.created_at).toLocaleString()} • {f.type}</p>
                    <p className="mt-1">{f.message}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
