import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PermissionGate } from '@/components/admin/PermissionGate';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Plus, Pencil, Trash2, FileText, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface AccountSummary {
  pp_id: number; // (kept same column name as your old table)
  yrs: number; // (kept same column name; hidden in UI)
  subject: string; // will store Event Name
  exam_paper_path: string | null; // will store Accounts Summary PDF path
  created_at: string;
  updated_at: string;
}

export default function AdminAccountsPage() {
  const { isSuperAdmin } = useAdminAuth();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AccountSummary | null>(null);

  // year is kept internally (not shown in UI). Default = current year
  const [formData, setFormData] = useState({
    yrs: new Date().getFullYear(),
    eventName: '',
  });

  const [summaryFile, setSummaryFile] = useState<File | null>(null);

  const queryClient = useQueryClient();

  // ✅ Fetch records (same table: past_papers)
  const { data: records, isLoading } = useQuery({
    queryKey: ['accounts-summaries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('past_papers')
        .select('*')
        .order('yrs', { ascending: false });

      if (error) throw error;
      return data as AccountSummary[];
    },
  });

  // ✅ Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData & { summaryFile?: File }) => {
      let summaryPath: string | null = null;

      // Upload summary PDF if provided
      if (data.summaryFile) {
        const fileExt = data.summaryFile.name.split('.').pop() || 'pdf';
        const safeEvent = data.eventName.trim().replace(/\s+/g, '_');
        const fileName = `${data.yrs}_${safeEvent}_accounts_summary.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('accounts-summaries')
          .upload(fileName, data.summaryFile);

        if (uploadError) throw uploadError;
        summaryPath = uploadData.path;
      }

      // Create DB record (same table/columns)
      const { data: result, error } = await supabase
        .from('past_papers')
        .insert({
          yrs: data.yrs,
          subject: data.eventName, // store event name into subject
          exam_paper_path: summaryPath, // store summary path into exam_paper_path
          scheme_path: null, // scheme removed
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-summaries'] });
      toast.success('Account summary created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error('Failed to create account summary: ' + (error?.message || 'Unknown error'));
    },
  });

  // ✅ Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { id: number } & typeof formData & { summaryFile?: File }) => {
      let summaryPath = editingRecord?.exam_paper_path ?? null;

      // Upload new summary if provided
      if (data.summaryFile) {
        const fileExt = data.summaryFile.name.split('.').pop() || 'pdf';
        const safeEvent = data.eventName.trim().replace(/\s+/g, '_');
        const fileName = `${data.yrs}_${safeEvent}_accounts_summary.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('accounts-summaries')
          .upload(fileName, data.summaryFile, { upsert: true });

        if (uploadError) throw uploadError;
        summaryPath = uploadData.path;
      }

      const { data: result, error } = await supabase
        .from('past_papers')
        .update({
          yrs: data.yrs,
          subject: data.eventName,
          exam_paper_path: summaryPath,
          scheme_path: null,
        })
        .eq('pp_id', data.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-summaries'] });
      toast.success('Account summary updated successfully');
      setEditingRecord(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error('Failed to update account summary: ' + (error?.message || 'Unknown error'));
    },
  });

  // ✅ Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (record: AccountSummary) => {
      // remove file from storage
      if (record.exam_paper_path) {
        await supabase.storage.from('accounts-summaries').remove([record.exam_paper_path]);
      }

      const { error } = await supabase.from('past_papers').delete().eq('pp_id', record.pp_id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-summaries'] });
      toast.success('Account summary deleted successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to delete account summary: ' + (error?.message || 'Unknown error'));
    },
  });

  const resetForm = () => {
    setFormData({
      yrs: new Date().getFullYear(),
      eventName: '',
    });
    setSummaryFile(null);
  };

  const handleCreate = () => {
    if (!formData.eventName.trim()) {
      toast.error('Please enter an event name');
      return;
    }
    createMutation.mutate({ ...formData, summaryFile });
  };

  const handleUpdate = () => {
    if (!editingRecord || !formData.eventName.trim()) {
      toast.error('Please enter an event name');
      return;
    }
    updateMutation.mutate({ id: editingRecord.pp_id, ...formData, summaryFile });
  };

  const handleEdit = (record: AccountSummary) => {
    setEditingRecord(record);
    setFormData({
      yrs: record.yrs,
      eventName: record.subject, // event name stored in subject
    });
    setIsCreateDialogOpen(false);
  };

  const handleDelete = (record: AccountSummary) => {
    if (confirm('Are you sure you want to delete this account summary? This action cannot be undone.')) {
      deleteMutation.mutate(record);
    }
  };

  // ✅ Super Admin only: set form year to next year
  const setNextYearForNewEntries = () => {
    setFormData((prev) => ({
      ...prev,
      yrs: (prev.yrs || new Date().getFullYear()) + 1,
    }));
    toast.success('Year set to next year for new entries');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <PermissionGate permissionKey="exam" permissionName="Exam Handling">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Accounts</h1>
            <p className="text-muted-foreground">Manage accounts summaries by event</p>
          </div>

          <Dialog
            open={isCreateDialogOpen || !!editingRecord}
            onOpenChange={(open) => {
              if (!open) {
                setIsCreateDialogOpen(false);
                setEditingRecord(null);
                resetForm();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Accounts
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingRecord ? 'Edit Accounts' : 'Add Accounts'}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* ✅ Year removed from UI */}

                <div>
                  <Label htmlFor="event-name">Event Name</Label>
                  <Input
                    id="event-name"
                    value={formData.eventName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, eventName: e.target.value }))}
                    placeholder="Enter event name"
                  />
                </div>

                <div>
                  <Label htmlFor="summary-pdf">Accounts Summary (PDF)</Label>
                  <Input
                    id="summary-pdf"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setSummaryFile(e.target.files?.[0] || null)}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={editingRecord ? handleUpdate : handleCreate}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1"
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {editingRecord ? 'Update' : 'Create'}
                  </Button>
                </div>

                {/* show which year is currently set (read-only hint) */}
                <div className="text-xs text-muted-foreground">
                  Saving under year: <span className="font-mono">{formData.yrs}</span>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* ✅ Super Admin “Danger” style card to set next year */}
        {isSuperAdmin && (
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-lg text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Admin Control
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                This will set the internal year used for new account summary uploads to the <strong>next year</strong>.
                (No data is deleted.)
              </p>
              <Button variant="destructive" onClick={setNextYearForNewEntries}>
                Set Next Year for New Entries
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ✅ Table card header renamed */}
        <Card>
          <CardHeader>
            <CardTitle>Accounts Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Year</TableHead>
                  <TableHead>Event Name</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {records?.map((record) => (
                  <TableRow key={record.pp_id}>
                    <TableCell>{record.yrs}</TableCell>
                    <TableCell>{record.subject}</TableCell>

                    <TableCell>
                      {record.exam_paper_path ? (
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={
                              supabase.storage
                                .from('accounts-summaries')
                                .getPublicUrl(record.exam_paper_path).data.publicUrl
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            View
                          </a>
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">No file</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(record)}>
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(record)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {(!records || records.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No records found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PermissionGate>
  );
}
