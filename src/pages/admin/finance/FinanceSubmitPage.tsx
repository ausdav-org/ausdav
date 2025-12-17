import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Receipt,
  Upload,
  Loader2,
  Check,
  X,
  Clock,
  FileText,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const categories = [
  'Membership Fee',
  'Donation',
  'Event Income',
  'Sponsorship',
  'Rent',
  'Utilities',
  'Transport',
  'Printing',
  'Catering',
  'Other',
];

interface Submission {
  id: string;
  txn_type: string;
  amount: number;
  txn_date: string;
  category: string;
  description: string | null;
  payer_payee: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
}

export default function FinanceSubmitPage() {
  const { user, profile } = useAdminAuth();
  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [formData, setFormData] = useState({
    txn_type: 'income' as 'income' | 'expense',
    amount: '',
    txn_date: new Date().toISOString().split('T')[0],
    category: '',
    description: '',
    payer_payee: '',
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('finance_submissions')
        .select('*')
        .eq('submitted_by', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      let receipt_path = null;

      // Upload receipt if provided
      if (receiptFile && user) {
        const fileExt = receiptFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, receiptFile);

        if (uploadError) throw uploadError;
        receipt_path = fileName;
      }

      const { error } = await supabase.from('finance_submissions').insert({
        submitted_by: user?.id,
        txn_type: formData.txn_type,
        amount: parseFloat(formData.amount),
        txn_date: formData.txn_date,
        category: formData.category,
        description: formData.description || null,
        payer_payee: formData.payer_payee || null,
        receipt_path,
      });

      if (error) throw error;

      toast.success('Submission sent for approval');
      setFormData({
        txn_type: 'income',
        amount: '',
        txn_date: new Date().toISOString().split('T')[0],
        category: '',
        description: '',
        payer_payee: '',
      });
      setReceiptFile(null);
      fetchSubmissions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <Check className="h-4 w-4 text-green-400" />;
      case 'rejected':
        return <X className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/20 text-green-400';
      case 'rejected':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-yellow-500/20 text-yellow-400';
    }
  };

  if (!profile?.can_submit_finance) {
    return (
      <div className="min-h-screen">
        <AdminHeader title="Submit Finance" breadcrumb="Finance" />
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full bg-card/50 backdrop-blur-sm border-border">
            <CardContent className="p-8 text-center">
              <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
              <p className="text-muted-foreground">
                You don't have permission to submit finance records. Contact an
                administrator to enable this feature for your account.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AdminHeader title="Submit Finance" breadcrumb="Finance" />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Submission Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  New Submission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Transaction Type *</Label>
                      <Select
                        value={formData.txn_type}
                        onValueChange={(v) =>
                          setFormData({ ...formData, txn_type: v as any })
                        }
                      >
                        <SelectTrigger className="bg-background/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">Income</SelectItem>
                          <SelectItem value="expense">Expense</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Amount (Rs.) *</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) =>
                          setFormData({ ...formData, amount: e.target.value })
                        }
                        placeholder="0.00"
                        className="bg-background/50"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date *</Label>
                      <Input
                        type="date"
                        value={formData.txn_date}
                        onChange={(e) =>
                          setFormData({ ...formData, txn_date: e.target.value })
                        }
                        className="bg-background/50"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Category *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(v) =>
                          setFormData({ ...formData, category: v })
                        }
                      >
                        <SelectTrigger className="bg-background/50">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>
                      {formData.txn_type === 'income' ? 'Payer' : 'Payee'}
                    </Label>
                    <Input
                      value={formData.payer_payee}
                      onChange={(e) =>
                        setFormData({ ...formData, payer_payee: e.target.value })
                      }
                      placeholder="Name of payer/payee"
                      className="bg-background/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder="Additional details..."
                      className="bg-background/50"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Receipt (PDF/Image)</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) =>
                          setReceiptFile(e.target.files?.[0] || null)
                        }
                        className="bg-background/50"
                      />
                    </div>
                    {receiptFile && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {receiptFile.name}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Submit for Approval
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Submission History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Your Submissions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loadingHistory ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="text-center py-12">
                    <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No submissions yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submissions.slice(0, 10).map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell className="text-sm">
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
                          <TableCell className="font-medium">
                            Rs. {sub.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(sub.status)}
                              <Badge className={cn('capitalize', getStatusBadge(sub.status))}>
                                {sub.status}
                              </Badge>
                            </div>
                            {sub.rejection_reason && (
                              <p className="text-xs text-red-400 mt-1">
                                {sub.rejection_reason}
                              </p>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
