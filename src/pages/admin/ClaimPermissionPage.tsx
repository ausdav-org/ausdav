import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  UserPlus,
  CalendarDays,
  GraduationCap,
  BookOpen,
  DollarSign,
  Megaphone,
  Send,
  Loader2,
  CheckCircle2,
  Clock,
  ShieldQuestion,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PermissionItem {
  key: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const permissionItems: PermissionItem[] = [
  {
    key: 'member',
    title: 'Member Handling',
    description: 'Manage member profiles, update roles, and handle member data.',
    icon: Users,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    key: 'applicant',
    title: 'Applicant Handling',
    description: 'Review and process new applicant registrations.',
    icon: UserPlus,
    color: 'from-emerald-500 to-teal-500',
  },
  {
    key: 'events',
    title: 'Event Handling',
    description: 'Create, update, and manage organization events and galleries.',
    icon: CalendarDays,
    color: 'from-purple-500 to-pink-500',
  },
  {
    key: 'exam',
    title: 'Exam Handling',
    description: 'Upload and manage past papers and exam resources.',
    icon: GraduationCap,
    color: 'from-orange-500 to-amber-500',
  },
  {
    key: 'seminar',
    title: 'Seminar Handling',
    description: 'Manage seminar materials and answer sheets.',
    icon: BookOpen,
    color: 'from-rose-500 to-red-500',
  },
  {
    key: 'finance',
    title: 'Finance Handling',
    description: 'Verify and approve financial submissions, manage ledger.',
    icon: DollarSign,
    color: 'from-green-500 to-emerald-500',
  },
  {
    key: 'announcement',
    title: 'Announcement Handling',
    description: 'Create and manage public announcements on the website.',
    icon: Megaphone,
    color: 'from-indigo-500 to-violet-500',
  },
];

interface ClaimRequest {
  permission: string;
  reason: string;
  status: 'idle' | 'pending' | 'submitted';
}

export default function ClaimPermissionPage() {
  const { profile, role, isSuperAdmin } = useAdminAuth();
  const [selectedPermission, setSelectedPermission] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedClaims, setSubmittedClaims] = useState<string[]>([]);

  // Only admins (not super_admin, not member) should see this
  if (isSuperAdmin) {
    return (
      <div className="p-6">
        <AdminHeader title="Claim Permission" breadcrumb="Admin / Claim Permission" />
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <ShieldQuestion className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">Not Applicable</h2>
          <p className="text-muted-foreground">
            Super Admins already have full access to all features.
          </p>
        </div>
      </div>
    );
  }

  if (role !== 'admin') {
    return (
      <div className="p-6">
        <AdminHeader title="Claim Permission" breadcrumb="Admin / Claim Permission" />
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <ShieldQuestion className="w-16 h-16 text-destructive mb-4" />
          <h2 className="text-xl font-bold mb-2">Access Restricted</h2>
          <p className="text-muted-foreground">
            Only Admins can claim additional permissions.
          </p>
        </div>
      </div>
    );
  }

  const handleSelectPermission = (key: string) => {
    if (submittedClaims.includes(key)) return;
    setSelectedPermission(selectedPermission === key ? null : key);
    setReason('');
  };

  const handleSubmitClaim = async () => {
    if (!selectedPermission || !reason.trim()) {
      toast.error('Please provide a reason for your request.');
      return;
    }

    setSubmitting(true);

    // Simulate API call - in production, this would insert into a permission_requests table
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setSubmittedClaims((prev) => [...prev, selectedPermission]);
    toast.success('Permission request submitted! A Super Admin will review your request.');
    setSelectedPermission(null);
    setReason('');
    setSubmitting(false);
  };

  const selectedItem = permissionItems.find((p) => p.key === selectedPermission);

  return (
    <div className="p-6 space-y-6">
      <AdminHeader title="Claim Permission" breadcrumb="Admin / Claim Permission" />

      {/* Intro Banner */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="flex items-start gap-4 p-6">
          <div className="p-3 rounded-xl bg-primary/10">
            <ShieldQuestion className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-1">Request Additional Permissions</h3>
            <p className="text-sm text-muted-foreground">
              As an Admin, you can request access to specific features. Select a permission below
              and provide a reason for your request. A Super Admin will review and approve or deny
              your request.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Permission Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {permissionItems.map((item, index) => {
          const isSelected = selectedPermission === item.key;
          const isSubmitted = submittedClaims.includes(item.key);

          return (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className={cn(
                  'cursor-pointer transition-all duration-300 hover:shadow-lg relative overflow-hidden group',
                  isSelected && 'ring-2 ring-primary shadow-lg',
                  isSubmitted && 'opacity-60 cursor-not-allowed'
                )}
                onClick={() => handleSelectPermission(item.key)}
              >
                {/* Gradient background on hover */}
                <div
                  className={cn(
                    'absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br',
                    item.color
                  )}
                />

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div
                      className={cn(
                        'p-2.5 rounded-xl bg-gradient-to-br text-white',
                        item.color
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                    </div>
                    {isSubmitted ? (
                      <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    ) : isSelected ? (
                      <Badge className="bg-primary/20 text-primary border-primary/30">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Selected
                      </Badge>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-base mb-2">{item.title}</CardTitle>
                  <CardDescription className="text-sm">{item.description}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Request Form */}
      {selectedPermission && selectedItem && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-primary/30">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'p-2.5 rounded-xl bg-gradient-to-br text-white',
                    selectedItem.color
                  )}
                >
                  <selectedItem.icon className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle>Request: {selectedItem.title}</CardTitle>
                  <CardDescription>
                    Explain why you need access to this feature
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Reason for Request <span className="text-destructive">*</span>
                </label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe why you need access to this permission and how you plan to use it..."
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                  Your request will be reviewed by a Super Admin.
                </p>
                <Button
                  onClick={handleSubmitClaim}
                  disabled={submitting || !reason.trim()}
                  className="gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Request
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Submitted Claims Summary */}
      {submittedClaims.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Pending Requests
            </CardTitle>
            <CardDescription>
              These permission requests are awaiting Super Admin approval.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {submittedClaims.map((key) => {
                const item = permissionItems.find((p) => p.key === key);
                if (!item) return null;
                return (
                  <Badge
                    key={key}
                    variant="outline"
                    className="gap-2 py-1.5 px-3 bg-muted/50"
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    {item.title}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
