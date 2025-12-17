import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  Plus,
  Calendar,
  FileText,
  Megaphone,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  monthlyIncome: number;
  monthlyExpense: number;
  pendingSubmissions: number;
  membersByBatch: { batch: string; count: number }[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    activeMembers: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    pendingSubmissions: 0,
    membersByBatch: [],
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch member stats
      const { data: profiles } = await supabase
        .from('profiles')
        .select('is_active, batch');

      if (profiles) {
        const totalMembers = profiles.length;
        const activeMembers = profiles.filter((p) => p.is_active).length;

        // Group by batch
        const batchCounts: { [key: string]: number } = {};
        profiles.forEach((p) => {
          const batch = p.batch || 'Unknown';
          batchCounts[batch] = (batchCounts[batch] || 0) + 1;
        });
        const membersByBatch = Object.entries(batchCounts)
          .map(([batch, count]) => ({ batch, count }))
          .sort((a, b) => b.count - a.count);

        setStats((prev) => ({
          ...prev,
          totalMembers,
          activeMembers,
          membersByBatch,
        }));
      }

      // Fetch pending submissions count
      const { count: pendingCount } = await supabase
        .from('finance_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Fetch monthly finance stats
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: transactions } = await supabase
        .from('finance_transactions')
        .select('txn_type, amount')
        .gte('txn_date', startOfMonth.toISOString().split('T')[0]);

      if (transactions) {
        const monthlyIncome = transactions
          .filter((t) => t.txn_type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0);
        const monthlyExpense = transactions
          .filter((t) => t.txn_type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        setStats((prev) => ({
          ...prev,
          monthlyIncome,
          monthlyExpense,
          pendingSubmissions: pendingCount || 0,
        }));
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Members',
      value: stats.totalMembers,
      subtitle: `${stats.activeMembers} active`,
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Monthly Income',
      value: `Rs. ${stats.monthlyIncome.toLocaleString()}`,
      subtitle: 'This month',
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Monthly Expense',
      value: `Rs. ${stats.monthlyExpense.toLocaleString()}`,
      subtitle: 'This month',
      icon: TrendingDown,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
    },
    {
      title: 'Pending Verification',
      value: stats.pendingSubmissions,
      subtitle: 'Finance submissions',
      icon: Receipt,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
    },
  ];

  const quickActions = [
    { title: 'Create Announcement', icon: Megaphone, href: '/admin/announcements' },
    { title: 'Add Event', icon: Calendar, href: '/admin/events' },
    { title: 'Upload Past Paper', icon: FileText, href: '/admin/exams' },
    { title: 'Verify Submissions', icon: Receipt, href: '/admin/finance/verify' },
  ];

  return (
    <div className="min-h-screen">
      <AdminHeader title="Dashboard" breadcrumb="Admin" />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-border hover:border-primary/30 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                    </div>
                    <div className={`${stat.bgColor} p-3 rounded-xl`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Members by Batch */}
          <Card className="lg:col-span-2 bg-card/50 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="text-lg">Members by Batch</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.membersByBatch.slice(0, 6).map((item) => (
                  <div key={item.batch} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{item.batch}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{
                            width: `${(item.count / stats.totalMembers) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{item.count}</span>
                    </div>
                  </div>
                ))}
                {stats.membersByBatch.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No members yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {quickActions.map((action) => (
                  <Button
                    key={action.title}
                    variant="outline"
                    className="w-full justify-start gap-3"
                    onClick={() => navigate(action.href)}
                  >
                    <action.icon className="h-4 w-4" />
                    {action.title}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Finance Overview */}
        <Card className="bg-card/50 backdrop-blur-sm border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Finance Overview - This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-500/10 rounded-xl">
                <p className="text-sm text-muted-foreground">Total Income</p>
                <p className="text-2xl font-bold text-green-400">
                  Rs. {stats.monthlyIncome.toLocaleString()}
                </p>
              </div>
              <div className="text-center p-4 bg-red-500/10 rounded-xl">
                <p className="text-sm text-muted-foreground">Total Expense</p>
                <p className="text-2xl font-bold text-red-400">
                  Rs. {stats.monthlyExpense.toLocaleString()}
                </p>
              </div>
              <div className="text-center p-4 bg-primary/10 rounded-xl">
                <p className="text-sm text-muted-foreground">Net Balance</p>
                <p className="text-2xl font-bold text-primary">
                  Rs. {(stats.monthlyIncome - stats.monthlyExpense).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
