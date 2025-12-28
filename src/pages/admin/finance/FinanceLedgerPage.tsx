import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Download,
  Search,
  Loader2,
  TrendingUp,
  TrendingDown,
  Plus,
  Pencil,
  MoreVertical,
  Trash2,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { PermissionGate } from '@/components/admin/PermissionGate';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Transaction {
  fin_id: number;
  exp_type: 'income' | 'expense';
  party_role: 'payer' | 'payee';
  amount: number;
  txn_date: string | null;
  category: string;
  description: string;
  created_at: string;
  submitted_by: string | null;
  verified_by: string | null;
  creator_name?: string;
  photo_path: string | null;
  approved: boolean;
}

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

const allCategories = ['All Categories', ...categories];

interface TransactionFormData {
  exp_type: 'income' | 'expense';
  party_role: 'payer' | 'payee';
  amount: string;
  txn_date: string;
  category: string;
  description: string;
}

const emptyFormData: TransactionFormData = {
  exp_type: 'income',
  party_role: 'payer',
  amount: '',
  txn_date: new Date().toISOString().split('T')[0],
  category: '',
  description: '',
};

// ✅ Receipt bucket (change if your storage bucket name is different)
const RECEIPT_BUCKET = 'receipts';

export default function FinanceLedgerPage() {
  const { user, isSuperAdmin, isAdmin } = useAdminAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All Categories');
  const [filterType, setFilterType] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Stats
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);

  // Add/Edit dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState<TransactionFormData>(emptyFormData);
  const [saving, setSaving] = useState(false);

  // ✅ NEW: Receipt upload state
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null);
  const [receiptUploading, setReceiptUploading] = useState(false);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canEdit = isSuperAdmin || isAdmin;

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (receiptPreviewUrl) URL.revokeObjectURL(receiptPreviewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTransactions = async () => {
    try {
      // Fetch only approved finance records for the ledger
      const { data, error } = await supabase
        .from('finance')
        .select('*')
        .eq('approved', true)
        .order('txn_date', { ascending: false });

      if (error) throw error;

      // Fetch creator names from members or profiles
      const submitterIds = [...new Set(data?.map((t: any) => t.submitted_by || t.verified_by).filter(Boolean))];
      const { data: membersData } = await supabase
        .from('members')
        .select('auth_user_id, fullname')
        .in('auth_user_id', submitterIds as string[]);

      const transactionsWithNames = (data || []).map((txn: any) => ({
        ...txn,
        creator_name: membersData?.find((m) => m.auth_user_id === (txn.submitted_by || txn.verified_by))?.fullname || 'System',
      })) as Transaction[];

      setTransactions(transactionsWithNames);

      // Calculate totals
      const income = transactionsWithNames
        .filter((t) => t.exp_type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const expense = transactionsWithNames
        .filter((t) => t.exp_type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      setTotalIncome(income);
      setTotalExpense(expense);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((txn) => {
    const matchesSearch =
      txn.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      filterCategory === 'All Categories' || txn.category === filterCategory;

    const matchesType =
      filterType === 'all' || txn.exp_type === filterType;

    const matchesDateFrom = !dateFrom || (txn.txn_date && txn.txn_date >= dateFrom);
    const matchesDateTo = !dateTo || (txn.txn_date && txn.txn_date <= dateTo);

    return matchesSearch && matchesCategory && matchesType && matchesDateFrom && matchesDateTo;
  });

  // Recalculate filtered totals
  const filteredIncome = filteredTransactions
    .filter((t) => t.exp_type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const filteredExpense = filteredTransactions
    .filter((t) => t.exp_type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const exportCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Description'];
    const rows = filteredTransactions.map((txn) => [
      txn.txn_date || '',
      txn.exp_type,
      txn.category,
      txn.amount,
      txn.description || '',
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finance-ledger-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  const resetReceiptState = () => {
    setReceiptFile(null);
    if (receiptPreviewUrl) URL.revokeObjectURL(receiptPreviewUrl);
    setReceiptPreviewUrl(null);
  };

  const handleOpenAddDialog = () => {
    setEditingTransaction(null);
    setFormData(emptyFormData);
    resetReceiptState();
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (txn: Transaction) => {
    setEditingTransaction(txn);
    setFormData({
      exp_type: txn.exp_type,
      party_role: txn.party_role,
      amount: txn.amount.toString(),
      txn_date: txn.txn_date || new Date().toISOString().split('T')[0],
      category: txn.category,
      description: txn.description || '',
    });
    resetReceiptState();
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTransaction(null);
    setFormData(emptyFormData);
    resetReceiptState();
  };

  const handleReceiptChange = (file: File | null) => {
    setReceiptFile(file);
    if (receiptPreviewUrl) URL.revokeObjectURL(receiptPreviewUrl);
    setReceiptPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const uploadReceiptIfAny = async (): Promise<string | null> => {
    if (!receiptFile) return null;

    try {
      setReceiptUploading(true);

      const safeName = receiptFile.name.replace(/[^\w.\-]+/g, '_');
      const path = `receipts/${Date.now()}-${user?.id || 'admin'}-${safeName}`;

      const { error } = await supabase.storage
        .from(RECEIPT_BUCKET)
        .upload(path, receiptFile, {
          cacheControl: '3600',
          upsert: true,
          contentType: receiptFile.type || 'image/*',
        });

      if (error) throw error;

      return path;
    } finally {
      setReceiptUploading(false);
    }
  };

  const handleSaveTransaction = async () => {
    if (!formData.category || !formData.amount || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      // ✅ Upload receipt image if provided
      let uploadedPhotoPath: string | null = null;
      if (receiptFile) {
        uploadedPhotoPath = await uploadReceiptIfAny();
      }

      if (editingTransaction) {
        // Update existing transaction
        const { error } = await supabase
          .from('finance')
          .update({
            exp_type: formData.exp_type,
            party_role: formData.party_role,
            amount: parseFloat(formData.amount),
            txn_date: formData.txn_date,
            category: formData.category,
            description: formData.description,
            // ✅ Keep existing unless a new receipt is uploaded
            photo_path: uploadedPhotoPath ?? editingTransaction.photo_path ?? null,
          })
          .eq('fin_id', editingTransaction.fin_id);

        if (error) throw error;
        toast.success('Transaction updated successfully');
      } else {
        // Create new transaction (admin direct entry - already approved)
        const { error } = await supabase
          .from('finance')
          .insert({
            exp_type: formData.exp_type,
            party_role: formData.party_role,
            amount: parseFloat(formData.amount),
            txn_date: formData.txn_date,
            category: formData.category,
            description: formData.description,
            approved: true, // Admin entries are pre-approved
            verified_by: user?.id,
            verified_at: new Date().toISOString(),
            // ✅ Save receipt path if uploaded
            photo_path: uploadedPhotoPath,
          } as any);

        if (error) throw error;
        toast.success('Transaction added successfully');
      }

      handleCloseDialog();
      fetchTransactions();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to save transaction');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = (txn: Transaction) => {
    setTransactionToDelete(txn);
    setDeleteDialogOpen(true);
  };

  const handleDeleteTransaction = async () => {
    if (!transactionToDelete) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('finance')
        .delete()
        .eq('fin_id', transactionToDelete.fin_id);

      if (error) throw error;

      toast.success('Transaction deleted successfully');
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
      fetchTransactions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete transaction');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <PermissionGate permissionKey="finance" permissionName="Finance Handling">
      <div className="min-h-screen">
        <AdminHeader title="Finance Ledger" breadcrumb="Finance" />

        <div className="p-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="bg-green-500/10 border-green-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Income</p>
                      <p className="text-2xl font-bold text-green-400">Rs. {filteredIncome.toLocaleString()}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="bg-red-500/10 border-red-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Expense</p>
                      <p className="text-2xl font-bold text-red-400">Rs. {filteredExpense.toLocaleString()}</p>
                    </div>
                    <TrendingDown className="h-8 w-8 text-red-400" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-primary/10 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Net Balance</p>
                      <p
                        className={cn(
                          'text-2xl font-bold',
                          filteredIncome - filteredExpense >= 0 ? 'text-primary' : 'text-red-400'
                        )}
                      >
                        Rs. {(filteredIncome - filteredExpense).toLocaleString()}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Filters */}
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search transactions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-background/50"
                    />
                  </div>
                </div>

                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[160px] bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[120px] bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-[140px] bg-background/50"
                    placeholder="From"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-[140px] bg-background/50"
                    placeholder="To"
                  />
                </div>

                <Button variant="outline" onClick={exportCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>

                {canEdit && (
                  <Button onClick={handleOpenAddDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Record
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Transactions
                <Badge className="ml-2">{filteredTransactions.length} records</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No transactions found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      {canEdit && <TableHead className="w-[50px]"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((txn) => (
                      <TableRow key={txn.fin_id}>
                        <TableCell>{txn.txn_date ? new Date(txn.txn_date).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              txn.exp_type === 'income'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            )}
                          >
                            {txn.exp_type}
                          </Badge>
                        </TableCell>
                        <TableCell>{txn.category}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{txn.description || '-'}</TableCell>
                        <TableCell
                          className={cn(
                            'text-right font-medium',
                            txn.exp_type === 'income' ? 'text-green-400' : 'text-red-400'
                          )}
                        >
                          {txn.exp_type === 'income' ? '+' : '-'} Rs. {txn.amount.toLocaleString()}
                        </TableCell>
                        {canEdit && (
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleOpenEditDialog(txn)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleConfirmDelete(txn)}
                                  className="text-red-400"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add/Edit Transaction Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}</DialogTitle>
              <DialogDescription>
                {editingTransaction ? 'Update the transaction details below.' : 'Enter the details for the new finance record.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Transaction Type *</Label>
                  <Select
                    value={formData.exp_type}
                    onValueChange={(v) =>
                      setFormData({
                        ...formData,
                        exp_type: v as 'income' | 'expense',
                        party_role: v === 'income' ? 'payer' : 'payee',
                      })
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
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    className="bg-background/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={formData.txn_date}
                    onChange={(e) => setFormData({ ...formData, txn_date: e.target.value })}
                    className="bg-background/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
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
                <Label>Description *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Details about this transaction..."
                  className="bg-background/50"
                  rows={3}
                />
              </div>

              {/* ✅ NEW: Receipt image upload */}
              <div className="space-y-2">
                <Label>Receipt Image (optional)</Label>

                {editingTransaction?.photo_path && !receiptFile && (
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    <span>Existing receipt attached.</span>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Input
                    type="file"
                    accept="image/*"
                    className="bg-background/50"
                    onChange={(e) => handleReceiptChange(e.target.files?.[0] ?? null)}
                  />
                  {receiptFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReceiptChange(null)}
                      title="Remove"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {receiptPreviewUrl && (
                  <div className="mt-2 overflow-hidden rounded-lg border border-border bg-background/40">
                    <img src={receiptPreviewUrl} alt="Receipt preview" className="w-full h-48 object-contain" />
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog} disabled={saving || receiptUploading}>
                Cancel
              </Button>
              <Button onClick={handleSaveTransaction} disabled={saving || receiptUploading}>
                {saving || receiptUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {receiptUploading ? 'Uploading...' : 'Saving...'}
                  </>
                ) : editingTransaction ? (
                  'Update Transaction'
                ) : (
                  'Add Transaction'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this transaction? This action cannot be undone.
                {transactionToDelete && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm">
                      <strong>Category:</strong> {transactionToDelete.category}
                    </p>
                    <p className="text-sm">
                      <strong>Amount:</strong> Rs. {transactionToDelete.amount.toLocaleString()}
                    </p>
                    <p className="text-sm">
                      <strong>Date:</strong>{' '}
                      {transactionToDelete.txn_date ? new Date(transactionToDelete.txn_date).toLocaleDateString() : '-'}
                    </p>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteTransaction}
                disabled={deleting}
                className="bg-red-500 hover:bg-red-600"
              >
                {deleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PermissionGate>
  );
}
