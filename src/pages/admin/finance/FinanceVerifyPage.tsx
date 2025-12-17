import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CheckSquare,
  Check,
  X,
  Loader2,
  Eye,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Submission {
  id: string;
  submitted_by: string;
  txn_type: string;
  amount: number;
  txn_date: string;
  category: string;
  description: string | null;
  payer_payee: string | null;
  receipt_path: string | null;
  status: string;
  created_at: string;
  submitter_name?: string;
}

export default function FinanceVerifyPage() {
  const { user } = useAdminAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('finance_submissions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch submitter names
      const submitterIds = [...new Set(data?.map((s) => s.submitted_by).filter(Boolean))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', submitterIds);

      const submissionsWithNames = (data || []).map((sub) => ({
        ...sub,
        submitter_name: profiles?.find((p) => p.user_id === sub.submitted_by)?.full_name || 'Unknown',
      }));

      setSubmissions(submissionsWithNames);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (submission: Submission) => {
    setProcessing(true);
    try {
      // Update submission status
      const { error: updateError } = await supabase
        .from('finance_submissions')
        .update({
          status: 'approved',
          verified_by: user?.id,
          verified_at: new Date().toISOString(),
        })
        .eq('id', submission.id);

      if (updateError) throw updateError;

      // Create ledger entry
      const { error: insertError } = await supabase
        .from('finance_transactions')
        .insert({
          txn_type: submission.txn_type as any,
          amount: submission.amount,
          txn_date: submission.txn_date,
          category: submission.category,
          description: submission.description,
          payer_payee: submission.payer_payee,
          receipt_path: submission.receipt_path,
          source_submission_id: submission.id,
          created_by: user?.id,
        });

      if (insertError) throw insertError;

      toast.success('Submission approved and added to ledger');
      setSubmissions((prev) => prev.filter((s) => s.id !== submission.id));
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve submission');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedSubmission) return;
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('finance_submissions')
        .update({
          status: 'rejected',
          verified_by: user?.id,
          verified_at: new Date().toISOString(),
          rejection_reason: rejectReason,
        })
        .eq('id', selectedSubmission.id);

      if (error) throw error;

      toast.success('Submission rejected');
      setSubmissions((prev) => prev.filter((s) => s.id !== selectedSubmission.id));
      setRejectDialogOpen(false);
      setRejectReason('');
      setSelectedSubmission(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject submission');
    } finally {
      setProcessing(false);
    }
  };

  const viewReceipt = async (receiptPath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('receipts')
        .createSignedUrl(receiptPath, 300); // 5 min expiry

      if (error) throw error;
      window.open(data.signedUrl, '_blank');
    } catch (error: any) {
      toast.error('Failed to load receipt');
    }
  };

  return (
    <div className="min-h-screen">
      <AdminHeader title="Verify Submissions" breadcrumb="Finance" />

      <div className="p-6 space-y-6">
        <Card className="bg-card/50 backdrop-blur-sm border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-primary" />
              Pending Submissions
              {submissions.length > 0 && (
                <Badge className="ml-2 bg-yellow-500/20 text-yellow-400">
                  {submissions.length} pending
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-12">
                <Check className="h-12 w-12 mx-auto text-green-400 mb-4" />
                <p className="text-muted-foreground">All submissions verified!</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Receipt</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <p className="font-medium">{sub.submitter_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(sub.created_at).toLocaleDateString()}
                        </p>
                      </TableCell>
                      <TableCell>
                        {new Date(sub.txn_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            sub.txn_type === 'income'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          )}
                        >
                          {sub.txn_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{sub.category}</TableCell>
                      <TableCell className="font-medium">
                        Rs. {sub.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {sub.receipt_path ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewReceipt(sub.receipt_path!)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-400 border-green-400/30 hover:bg-green-500/10"
                            onClick={() => handleApprove(sub)}
                            disabled={processing}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-400 border-red-400/30 hover:bg-red-500/10"
                            onClick={() => {
                              setSelectedSubmission(sub);
                              setRejectDialogOpen(true);
                            }}
                            disabled={processing}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Submission Details Section */}
        {submissions.length > 0 && (
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="text-lg">Submission Details</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Click on a submission in the table above to view detailed information.
                Review the receipt and details before approving or rejecting.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              Reject Submission
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this submission. The submitter
              will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reject-reason">Rejection Reason *</Label>
            <Textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter the reason for rejection..."
              className="mt-2"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectReason('');
                setSelectedSubmission(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                'Reject Submission'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
