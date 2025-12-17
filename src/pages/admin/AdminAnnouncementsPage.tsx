import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Megaphone,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
  GripVertical,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Announcement {
  id: string;
  title_en: string;
  title_ta: string | null;
  message_en: string | null;
  message_ta: string | null;
  tag: string;
  link_url: string | null;
  cta_label: string | null;
  is_active: boolean;
  priority: number;
  created_at: string;
}

const tags = ['General', 'Event', 'Exam', 'Notice', 'Urgent'];

export default function AdminAnnouncementsPage() {
  const { user } = useAdminAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title_en: '',
    title_ta: '',
    message_en: '',
    message_ta: '',
    tag: 'General',
    link_url: '',
    cta_label: '',
    is_active: true,
    priority: 0,
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast.error('Failed to fetch announcements');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title_en: '',
      title_ta: '',
      message_en: '',
      message_ta: '',
      tag: 'General',
      link_url: '',
      cta_label: '',
      is_active: true,
      priority: 0,
    });
    setEditingId(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (announcement: Announcement) => {
    setFormData({
      title_en: announcement.title_en,
      title_ta: announcement.title_ta || '',
      message_en: announcement.message_en || '',
      message_ta: announcement.message_ta || '',
      tag: announcement.tag || 'General',
      link_url: announcement.link_url || '',
      cta_label: announcement.cta_label || '',
      is_active: announcement.is_active,
      priority: announcement.priority,
    });
    setEditingId(announcement.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title_en) {
      toast.error('Title (English) is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title_en: formData.title_en,
        title_ta: formData.title_ta || null,
        message_en: formData.message_en || null,
        message_ta: formData.message_ta || null,
        tag: formData.tag,
        link_url: formData.link_url || null,
        cta_label: formData.cta_label || null,
        is_active: formData.is_active,
        priority: formData.priority,
        created_by: user?.id,
      };

      if (editingId) {
        const { error } = await supabase
          .from('announcements')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Announcement updated');
      } else {
        const { error } = await supabase.from('announcements').insert(payload);
        if (error) throw error;
        toast.success('Announcement created');
      }

      setDialogOpen(false);
      resetForm();
      fetchAnnouncements();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save announcement');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (announcement: Announcement) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ is_active: !announcement.is_active })
        .eq('id', announcement.id);

      if (error) throw error;
      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === announcement.id ? { ...a, is_active: !a.is_active } : a
        )
      );
      toast.success(announcement.is_active ? 'Announcement hidden' : 'Announcement visible');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      toast.success('Announcement deleted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'Urgent':
        return 'bg-red-500/20 text-red-400';
      case 'Event':
        return 'bg-purple-500/20 text-purple-400';
      case 'Exam':
        return 'bg-blue-500/20 text-blue-400';
      case 'Notice':
        return 'bg-yellow-500/20 text-yellow-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen">
      <AdminHeader title="Announcements" breadcrumb="Content" />

      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            Manage announcements that appear on the public website carousel.
          </p>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            New Announcement
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : announcements.length === 0 ? (
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardContent className="p-12 text-center">
              <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No announcements yet</p>
              <Button className="mt-4" onClick={openCreateDialog}>
                Create First Announcement
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement, index) => (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={cn(
                  'bg-card/50 backdrop-blur-sm border-border transition-opacity',
                  !announcement.is_active && 'opacity-60'
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getTagColor(announcement.tag)}>
                            {announcement.tag}
                          </Badge>
                          {!announcement.is_active && (
                            <Badge className="bg-muted text-muted-foreground">
                              Hidden
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground ml-auto">
                            Priority: {announcement.priority}
                          </span>
                        </div>
                        <h3 className="font-semibold">{announcement.title_en}</h3>
                        {announcement.title_ta && (
                          <p className="text-sm text-muted-foreground">
                            {announcement.title_ta}
                          </p>
                        )}
                        {announcement.message_en && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {announcement.message_en}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleActive(announcement)}
                        >
                          {announcement.is_active ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(announcement)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-400 hover:text-red-300"
                          onClick={() => handleDelete(announcement.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Announcement' : 'Create Announcement'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title (English) *</Label>
                <Input
                  value={formData.title_en}
                  onChange={(e) =>
                    setFormData({ ...formData, title_en: e.target.value })
                  }
                  placeholder="Announcement title"
                />
              </div>
              <div className="space-y-2">
                <Label>Title (Tamil)</Label>
                <Input
                  value={formData.title_ta}
                  onChange={(e) =>
                    setFormData({ ...formData, title_ta: e.target.value })
                  }
                  placeholder="தமிழ் தலைப்பு"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Message (English)</Label>
                <Textarea
                  value={formData.message_en}
                  onChange={(e) =>
                    setFormData({ ...formData, message_en: e.target.value })
                  }
                  placeholder="Optional message"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Message (Tamil)</Label>
                <Textarea
                  value={formData.message_ta}
                  onChange={(e) =>
                    setFormData({ ...formData, message_ta: e.target.value })
                  }
                  placeholder="விருப்பமான செய்தி"
                  rows={3}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tag</Label>
                <Select
                  value={formData.tag}
                  onValueChange={(v) => setFormData({ ...formData, tag: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tags.map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Input
                  type="number"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })
                  }
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label>Active</Label>
                <div className="flex items-center gap-2 pt-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                  <span className="text-sm text-muted-foreground">
                    {formData.is_active ? 'Visible' : 'Hidden'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Link URL</Label>
                <Input
                  value={formData.link_url}
                  onChange={(e) =>
                    setFormData({ ...formData, link_url: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>CTA Label</Label>
                <Input
                  value={formData.cta_label}
                  onChange={(e) =>
                    setFormData({ ...formData, cta_label: e.target.value })
                  }
                  placeholder="Learn More"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editingId ? (
                'Update'
              ) : (
                'Create'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
