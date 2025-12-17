import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Download,
  Filter,
  Search,
  Loader2,
  TrendingUp,
  TrendingDown,
  Calendar,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Transaction {
  id: string;
  txn_type: string;
  amount: number;
  txn_date: string;
  category: string;
  description: string | null;
  payer_payee: string | null;
  created_at: string;
  creator_name?: string;
}

const categories = [
  'All Categories',
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

export default function FinanceLedgerPage() {
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

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      let query = supabase
        .from('finance_transactions')
        .select('*')
        .order('txn_date', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      // Fetch creator names
      const creatorIds = [...new Set(data?.map((t) => t.created_by).filter(Boolean))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', creatorIds);

      const transactionsWithNames = (data || []).map((txn) => ({
        ...txn,
        creator_name: profiles?.find((p) => p.user_id === txn.created_by)?.full_name || 'System',
      }));

      setTransactions(transactionsWithNames);

      // Calculate totals
      const income = transactionsWithNames
        .filter((t) => t.txn_type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const expense = transactionsWithNames
        .filter((t) => t.txn_type === 'expense')
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
      txn.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.payer_payee?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      filterCategory === 'All Categories' || txn.category === filterCategory;

    const matchesType =
      filterType === 'all' || txn.txn_type === filterType;

    const matchesDateFrom = !dateFrom || txn.txn_date >= dateFrom;
    const matchesDateTo = !dateTo || txn.txn_date <= dateTo;

    return matchesSearch && matchesCategory && matchesType && matchesDateFrom && matchesDateTo;
  });

  // Recalculate filtered totals
  const filteredIncome = filteredTransactions
    .filter((t) => t.txn_type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const filteredExpense = filteredTransactions
    .filter((t) => t.txn_type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const exportCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Payer/Payee', 'Description'];
    const rows = filteredTransactions.map((txn) => [
      txn.txn_date,
      txn.txn_type,
      txn.category,
      txn.amount,
      txn.payer_payee || '',
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

  return (
    <div className="min-h-screen">
      <AdminHeader title="Finance Ledger" breadcrumb="Finance" />

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-green-500/10 border-green-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Income</p>
                    <p className="text-2xl font-bold text-green-400">
                      Rs. {filteredIncome.toLocaleString()}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-red-500/10 border-red-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Expense</p>
                    <p className="text-2xl font-bold text-red-400">
                      Rs. {filteredExpense.toLocaleString()}
                    </p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-400" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-primary/10 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Net Balance</p>
                    <p className={cn(
                      'text-2xl font-bold',
                      filteredIncome - filteredExpense >= 0 ? 'text-primary' : 'text-red-400'
                    )}>
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
                  {categories.map((cat) => (
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
                    <TableHead>Payer/Payee</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell>
                        {new Date(txn.txn_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            txn.txn_type === 'income'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          )}
                        >
                          {txn.txn_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{txn.category}</TableCell>
                      <TableCell>{txn.payer_payee || '-'}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {txn.description || '-'}
                      </TableCell>
                      <TableCell className={cn(
                        'text-right font-medium',
                        txn.txn_type === 'income' ? 'text-green-400' : 'text-red-400'
                      )}>
                        {txn.txn_type === 'income' ? '+' : '-'} Rs. {txn.amount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
