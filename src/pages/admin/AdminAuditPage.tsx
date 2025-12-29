import React, { useEffect, useMemo, useState } from 'react';
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
import {
  Plus,
  Pencil,
  Trash2,
  FileText,
  Loader2,
  ShieldCheck,
  ShieldOff,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';

interface AccountSummary {
  pp_id: number;
  yrs: number;
  subject: string;
  exam_paper_path: string | null;
  created_at: string;
  updated_at: string;
}

type AccountsAccessRow = {
  yrs: number;
  allowed: boolean;
  allowed_by: string | null;
  allowed_at: string | null;
};

export default function AdminAccountsPage() {
  // ✅ Safer: some contexts provide role, some provide isAdmin/isSuperAdmin
  const auth = useAdminAuth() as any;
  const role: string = auth?.role ?? '';
  const isSuperAdmin: boolean = !!auth?.isSuperAdmin || role === 'super_admin';
  const isAdmin: boolean = !!auth?.isAdmin || role === 'admin' || role === 'super_admin';

  const queryClient = useQueryClient();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AccountSummary | null>(null);

  const [formData, setFormData] = useState({
    yrs: new Date().getFullYear(),
    eventName: '',
  });

  const [summaryFile, setSummaryFile] = useState<File | null>(null);

  // ✅ Year accordion
  const [expandedYear, setExpandedYear] = useState<number | null>(null);

  // ✅ Toggle card visibility
  const [showAccessCard, setShowAccessCard] = useState(false);

  // ✅ who am I
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [myBatchYear, setMyBatchYear] = useState<number | null>(null);

  // ✅ access state
  const [accountsAllowedForMyYear, setAccountsAllowedForMyYear] = useState<boolean>(false);
  const [loadingAccess, setLoadingAccess] = useState<boolean>(false);

  // ✅ Fetch records
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

  // ✅ Group years
  const years = useMemo(() => {
    const set = new Set<number>();
    (records ?? []).forEach((r) => set.add(r.yrs));
    return Array.from(set).sort((a, b) => b - a);
  }, [records]);

  const recordsForYear = (year: number) => (records ?? []).filter((r) => r.yrs === year);

  const refreshAccessForYear = async (yrs: number) => {
    try {
      setLoadingAccess(true);

      const res = await supabase
        .from('accounts_access' as any)
        .select('yrs, allowed, allowed_by, allowed_at')
        .eq('yrs', yrs)
        .maybeSingle();

      if (res.error) throw res.error;

      const row = (res.data as unknown as AccountsAccessRow | null) ?? null;
      setAccountsAllowedForMyYear(row?.allowed ?? false);
    } catch (e) {
      console.error('refreshAccessForYear failed', e);
      setAccountsAllowedForMyYear(false);
    } finally {
      setLoadingAccess(false);
    }
  };

  // ✅ Load auth + batch/year (RPC to avoid SelectQueryError)
  useEffect(() => {
    const run = async () => {
      try {
        const { data: authData, error: authErr } = await supabase.auth.getUser();
        if (authErr) throw authErr;

        const uid = authData?.user?.id ?? null;
        setCurrentUserId(uid);
        if (!uid) return;

        const { data: batchData, error: batchErr } = await (supabase.rpc as any)('get_my_batch');
        if (batchErr) {
          console.error('get_my_batch rpc missing or failed:', batchErr);
          toast.error('Missing RPC: get_my_batch (needed to load your batch/year)');
          return;
        }

        const batch = (batchData ?? null) as number | null;
        setMyBatchYear(batch);

        if (batch) await refreshAccessForYear(batch);
      } catch (e) {
        console.error('load user batch/year failed', e);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setAccountsAccessForMyYear = async (allowed: boolean) => {
    if (!isSuperAdmin) {
      toast.error('Only super admins can change this setting');
      return;
    }
    if (!currentUserId) {
      toast.error('Not logged in');
      return;
    }
    if (!myBatchYear) {
      toast.error('Your member record has no batch/year');
      return;
    }

    try {
      setLoadingAccess(true);

      const upsertRes = await supabase
        .from('accounts_access' as any)
        .upsert(
          {
            yrs: myBatchYear,
            allowed,
            allowed_by: currentUserId,
            allowed_at: new Date().toISOString(),
          },
          { onConflict: 'yrs' }
        );

      if (upsertRes.error) throw upsertRes.error;

      setAccountsAllowedForMyYear(allowed);
      toast.success(
        allowed
          ? `Enabled visibility for batch/year ${myBatchYear}`
          : `Disabled visibility for batch/year ${myBatchYear}`
      );
    } catch (e: any) {
      console.error('setAccountsAccessForMyYear failed', e);
      toast.error(e?.message || 'Failed to update setting');
    } finally {
      setLoadingAccess(false);
    }
  };

  const resetForm = () => {
    setFormData({
      yrs: new Date().getFullYear(),
      eventName: '',
    });
    setSummaryFile(null);
  };

  // ✅ Create
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData & { summaryFile?: File }) => {
      let summaryPath: string | null = null;

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

      const { data: result, error } = await supabase
        .from('past_papers')
        .insert({
          yrs: data.yrs,
          subject: data.eventName,
          exam_paper_path: summaryPath,
          scheme_path: null,
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

  // ✅ Update
  const updateMutation = useMutation({
    mutationFn: async (data: { id: number } & typeof formData & { summaryFile?: File }) => {
      let summaryPath = editingRecord?.exam_paper_path ?? null;

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

  // ✅ Delete
  const deleteMutation = useMutation({
    mutationFn: async (record: AccountSummary) => {
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

  const handleCreate = () => {
    if (!isSuperAdmin) {
      toast.error('Only super admins can create accounts summaries');
      return;
    }
    if (!formData.eventName.trim()) {
      toast.error('Please enter an event name');
      return;
    }
    createMutation.mutate({ ...formData, summaryFile });
  };

  const handleUpdate = () => {
    if (!isSuperAdmin) {
      toast.error('Only super admins can update accounts summaries');
      return;
    }
    if (!editingRecord || !formData.eventName.trim()) {
      toast.error('Please enter an event name');
      return;
    }
    updateMutation.mutate({ id: editingRecord.pp_id, ...formData, summaryFile });
  };

  const handleEdit = (record: AccountSummary) => {
    if (!isSuperAdmin) return;
    setEditingRecord(record);
    setFormData({
      yrs: record.yrs,
      eventName: record.subject,
    });
    setIsCreateDialogOpen(false);
  };

  const handleDelete = (record: AccountSummary) => {
    if (!isSuperAdmin) return;
    if (confirm('Are you sure you want to delete this account summary? This action cannot be undone.')) {
      deleteMutation.mutate(record);
    }
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
        {/* Header + Add */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Audit (Accounts)</h1>
            <p className="text-muted-foreground">Committee year → expand to view event-wise accounts summary files</p>
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
              <Button
                onClick={() => {
                  if (!isSuperAdmin) {
                    toast.error('Only super admins can add accounts');
                    return;
                  }
                  setIsCreateDialogOpen(true);
                }}
                disabled={!isSuperAdmin}
                title={!isSuperAdmin ? 'Super Admin only' : undefined}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Accounts
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingRecord ? 'Edit Accounts' : 'Add Accounts'}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
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
                    disabled={!isSuperAdmin || createMutation.isPending || updateMutation.isPending}
                    className="flex-1"
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {editingRecord ? 'Update' : 'Create'}
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                  Saving under year: <span className="font-mono">{formData.yrs}</span>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* ✅ Button to reveal extra card */}
        {(isAdmin || isSuperAdmin) && (
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowAccessCard((s) => !s)}>
              {showAccessCard ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
              {showAccessCard ? 'Hide Control' : 'Show Control'}
            </Button>
          </div>
        )}

        {/* ✅ Extra card */}
        {(isAdmin || isSuperAdmin) && showAccessCard && (
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="text-lg">Accounts / Audit Visibility</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Control whether members in the same batch/year can view Accounts/Audit.</div>
                <div>
                  Your batch/year:{' '}
                  <span className="font-mono text-foreground">{myBatchYear ?? 'N/A'}</span>{' '}
                  {myBatchYear ? (
                    <span className={accountsAllowedForMyYear ? 'text-green-500' : 'text-red-500'}>
                      ({accountsAllowedForMyYear ? 'ENABLED' : 'DISABLED'})
                    </span>
                  ) : null}
                </div>
                {!isSuperAdmin && <div className="text-xs">Only Super Admin can change this setting.</div>}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setAccountsAccessForMyYear(true)}
                  disabled={!isSuperAdmin || loadingAccess || !myBatchYear}
                >
                  {loadingAccess ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="mr-2 h-4 w-4" />
                  )}
                  Allow
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setAccountsAccessForMyYear(false)}
                  disabled={!isSuperAdmin || loadingAccess || !myBatchYear}
                >
                  {loadingAccess ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldOff className="mr-2 h-4 w-4" />
                  )}
                  Disable
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ✅ Year accordion */}
        <div className="space-y-4">
          {years.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">No records found</CardContent>
            </Card>
          ) : (
            years.map((yr) => {
              const isOpen = expandedYear === yr;
              const list = recordsForYear(yr);

              return (
                <Card key={yr}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-xl">Committee Year: {yr}</CardTitle>
                        <div className="text-sm text-muted-foreground">
                          {list.length} event{list.length === 1 ? '' : 's'}
                        </div>
                      </div>

                      <Button variant="outline" onClick={() => setExpandedYear(isOpen ? null : yr)}>
                        {isOpen ? 'Hide' : 'View'}
                      </Button>
                    </div>
                  </CardHeader>

                  {isOpen && (
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Event Name</TableHead>
                            <TableHead>Summary</TableHead>
                            <TableHead className="w-[140px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          {list.map((record) => (
                            <TableRow key={record.pp_id}>
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
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(record)}
                                    disabled={!isSuperAdmin}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(record)}
                                    disabled={!isSuperAdmin || deleteMutation.isPending}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}

                          {list.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                No events for this year
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>
    </PermissionGate>
  );
}
