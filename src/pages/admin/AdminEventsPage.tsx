import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, Calendar, MapPin, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Event {
  id: string;
  title_en: string;
  title_ta: string | null;
  description_en: string | null;
  description_ta: string | null;
  event_date: string;
  location: string | null;
  is_active: boolean;
  created_at: string;
  image_bucket: string | null;
  image_path: string | null;
}

type EventFormState = {
  title_en: string;
  title_ta: string;
  description_en: string;
  description_ta: string;
  event_date: string; // still required by schema, defaulted silently
  location: string;
  is_active: boolean;
  image_bucket: string;
  image_path: string | null;
};

const AdminEventsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<EventFormState>({
    title_en: '',
    title_ta: '',
    description_en: '',
    description_ta: '',
    event_date: new Date().toISOString().split('T')[0],
    location: '',
    is_active: true,
    image_bucket: 'events',
    image_path: null,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const validateForm = () => {
    if (!formData.title_en.trim()) {
      toast.error('Title (English) is required');
      return false;
    }
    if (!formData.event_date) {
      toast.error('Event date is required');
      return false;
    }
    return true;
  };

  // Fetch events using raw query
  const { data: events, isLoading } = useQuery({
    queryKey: ['admin-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events' as any)
        .select('id,title_en,title_ta,description_en,description_ta,event_date,location,is_active,created_at,image_bucket,image_path')
        .order('event_date', { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as Event[];
    },
  });

  // Create event mutation
  const createMutation = useMutation({
    mutationFn: async (data: EventFormState) => {
      const { error } = await supabase
        .from('events' as any)
        .insert([data] as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      toast.success('Event created successfully');
      resetForm();
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast.error('Failed to create event: ' + error.message);
      setIsSubmitting(false);
    },
  });

  // Update event mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EventFormState }) => {
      const { error } = await supabase
        .from('events' as any)
        .update(data as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      toast.success('Event updated successfully');
      resetForm();
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast.error('Failed to update event: ' + error.message);
      setIsSubmitting(false);
    },
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Delete event mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('events' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      toast.success('Event deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete event: ' + error.message);
    },
  });

  // Toggle active status
  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('events' as any)
        .update({ is_active } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      toast.success('Event status updated');
    },
    onError: (error) => {
      toast.error('Failed to update status: ' + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      title_en: '',
      title_ta: '',
      description_en: '',
      description_ta: '',
      event_date: new Date().toISOString().split('T')[0],
      location: '',
      is_active: true,
      image_bucket: 'events',
      image_path: null,
    });
    setImageFile(null);
    setImagePreviewUrl(null);
    setEditingEvent(null);
    setIsDialogOpen(false);
    setIsSubmitting(false);
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title_en: event.title_en,
      title_ta: event.title_ta || '',
      description_en: event.description_en || '',
      description_ta: event.description_ta || '',
      event_date: event.event_date,
      location: event.location || '',
      is_active: event.is_active,
      image_bucket: event.image_bucket || 'events',
      image_path: event.image_path,
    });
    setImageFile(null);
    if (event.image_path) {
      const { data } = supabase.storage
        .from(event.image_bucket || 'events')
        .getPublicUrl(event.image_path);
      setImagePreviewUrl(data?.publicUrl ?? null);
    } else {
      setImagePreviewUrl(null);
    }
    setIsDialogOpen(true);
  };

  const uploadImageIfNeeded = async (): Promise<{ bucket: string; path: string } | null> => {
    if (!imageFile) {
      return formData.image_path ? { bucket: formData.image_bucket, path: formData.image_path } : null;
    }

    const ext = imageFile.name.split('.').pop() || 'jpg';
    const bucket = 'events';
    const path = `events/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, imageFile, { upsert: true, contentType: imageFile.type });

    if (uploadError) throw uploadError;

    return { bucket, path };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isSaving) return; // guard against double submits

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const uploaded = await uploadImageIfNeeded();

      let image_bucket = formData.image_bucket;
      let image_path = formData.image_path;

      if (uploaded) {
        image_bucket = uploaded.bucket;
        image_path = uploaded.path;
      }

      const payload: EventFormState = {
        ...formData,
        event_date: formData.event_date || new Date().toISOString().split('T')[0],
        location: formData.location,
        image_bucket,
        image_path,
      };

      if (editingEvent) {
        await updateMutation.mutateAsync({ id: editingEvent.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save event');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Events Management</h1>
          <p className="text-muted-foreground mt-1">Create and manage events for the organization</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => resetForm()}
              className="gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isSubmitting || isSaving}
              aria-busy={isSubmitting || isSaving}
              aria-disabled={isSubmitting || isSaving}
            >
              {(isSubmitting || isSaving) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {(isSubmitting || isSaving) ? 'Saving...' : 'Add Event'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEvent ? 'Edit Event' : 'Create New Event'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title_en">Title (English) *</Label>
                  <Input
                    id="title_en"
                    value={formData.title_en}
                    onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                    required
                    placeholder="Event title in English"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title_ta">Title (Tamil)</Label>
                  <Input
                    id="title_ta"
                    value={formData.title_ta}
                    onChange={(e) => setFormData({ ...formData, title_ta: e.target.value })}
                    placeholder="தமிழ் தலைப்பு"
                    className="font-tamil"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="description_en">Description (English)</Label>
                  <Textarea
                    id="description_en"
                    value={formData.description_en}
                    onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                    placeholder="Event description in English"
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description_ta">Description (Tamil)</Label>
                  <Textarea
                    id="description_ta"
                    value={formData.description_ta}
                    onChange={(e) => setFormData({ ...formData, description_ta: e.target.value })}
                    placeholder="தமிழ் விளக்கம்"
                    rows={4}
                    className="font-tamil"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-image">Event Image (optional)</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="event-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setImageFile(file);
                    }}
                  />
                  {imagePreviewUrl && !imageFile && (
                    <Button type="button" variant="outline" asChild size="sm">
                      <a href={imagePreviewUrl} target="_blank" rel="noreferrer">
                        <ImageIcon className="w-4 h-4 mr-2" />View
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || isSaving}
                  aria-busy={isSubmitting || isSaving}
                  aria-disabled={isSubmitting || isSaving}
                  className="gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {(isSubmitting || isSaving) && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-accent" />
            All Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading events...</div>
          ) : events && events.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{event.title_en}</div>
                        {event.title_ta && (
                          <div className="text-sm text-muted-foreground font-tamil">{event.title_ta}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {format(new Date(event.event_date), 'MMM d, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {event.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          {event.location}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={event.is_active}
                        onCheckedChange={(checked) => toggleMutation.mutate({ id: event.id, is_active: checked })}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(event)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this event?')) {
                              deleteMutation.mutate(event.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No events yet</h3>
              <p className="text-muted-foreground mb-4">Create your first event to get started</p>
              <Button
                onClick={() => setIsDialogOpen(true)}
                disabled={isSubmitting || isSaving}
                aria-busy={isSubmitting || isSaving}
                aria-disabled={isSubmitting || isSaving}
                className="gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {(isSubmitting || isSaving) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {(isSubmitting || isSaving) ? 'Saving...' : 'Add Event'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminEventsPage;
