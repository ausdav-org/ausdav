import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  MoreVertical,
  UserPlus,
  Check,
  X,
  Loader2,
  Mail,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Member {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  batch: string | null;
  is_active: boolean;
  can_submit_finance: boolean;
  created_at: string;
  role?: string;
}

export default function AdminMembersPage() {
  const { isSuperAdmin } = useAdminAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBatch, setFilterBatch] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Invite dialog
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('member');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const membersWithRoles = (profiles || []).map((profile) => ({
        ...profile,
        role: roles?.find((r) => r.user_id === profile.user_id)?.role || 'member',
      }));

      setMembers(membersWithRoles);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Failed to fetch members');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (member: Member) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !member.is_active })
        .eq('id', member.id);

      if (error) throw error;

      setMembers((prev) =>
        prev.map((m) =>
          m.id === member.id ? { ...m, is_active: !m.is_active } : m
        )
      );
      toast.success(
        `Member ${!member.is_active ? 'activated' : 'deactivated'} successfully`
      );
    } catch (error: any) {
      toast.error(error.message || 'Failed to update member');
    }
  };

  const toggleFinancePermission = async (member: Member) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ can_submit_finance: !member.can_submit_finance })
        .eq('id', member.id);

      if (error) throw error;

      setMembers((prev) =>
        prev.map((m) =>
          m.id === member.id
            ? { ...m, can_submit_finance: !m.can_submit_finance }
            : m
        )
      );
      toast.success('Finance permission updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update permission');
    }
  };

  const changeRole = async (member: Member, newRole: string) => {
    if (!isSuperAdmin && newRole === 'super_admin') {
      toast.error('Only super admins can assign super admin role');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole as any })
        .eq('user_id', member.user_id);

      if (error) throw error;

      setMembers((prev) =>
        prev.map((m) =>
          m.id === member.id ? { ...m, role: newRole } : m
        )
      );
      toast.success('Role updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update role');
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail || !inviteName) {
      toast.error('Please fill in all fields');
      return;
    }

    setInviting(true);
    try {
      // Note: In production, you would use an edge function to send invites
      // For now, we'll create the user directly (super_admin only)
      toast.info('Invite functionality requires email service setup');
      setInviteOpen(false);
      setInviteEmail('');
      setInviteName('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send invite');
    } finally {
      setInviting(false);
    }
  };

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBatch =
      filterBatch === 'all' || member.batch === filterBatch;
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && member.is_active) ||
      (filterStatus === 'inactive' && !member.is_active);
    return matchesSearch && matchesBatch && matchesStatus;
  });

  const uniqueBatches = [...new Set(members.map((m) => m.batch).filter(Boolean))];

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-500/20 text-red-400';
      case 'admin':
        return 'bg-primary/20 text-primary';
      case 'member':
        return 'bg-green-500/20 text-green-400';
      case 'honourable':
        return 'bg-yellow-500/20 text-yellow-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen">
      <AdminHeader title="Members" breadcrumb="Management" />

      <div className="p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-1 gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/50"
              />
            </div>

            <Select value={filterBatch} onValueChange={setFilterBatch}>
              <SelectTrigger className="w-[140px] bg-background/50">
                <SelectValue placeholder="All Batches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Batches</SelectItem>
                {uniqueBatches.map((batch) => (
                  <SelectItem key={batch} value={batch!}>
                    {batch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px] bg-background/50">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isSuperAdmin && (
            <Button onClick={() => setInviteOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
          )}
        </div>

        {/* Members Table */}
        <Card className="bg-card/50 backdrop-blur-sm border-border">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Finance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{member.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {member.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{member.batch || '-'}</TableCell>
                      <TableCell>
                        <Badge className={cn('capitalize', getRoleBadgeColor(member.role || ''))}>
                          {member.role?.replace('_', ' ') || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            member.is_active
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          )}
                        >
                          {member.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            member.can_submit_finance
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {member.can_submit_finance ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => toggleActive(member)}
                            >
                              {member.is_active ? (
                                <>
                                  <X className="mr-2 h-4 w-4" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Check className="mr-2 h-4 w-4" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => toggleFinancePermission(member)}
                            >
                              Toggle Finance Permission
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {isSuperAdmin && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => changeRole(member, 'member')}
                                  disabled={member.role === 'member'}
                                >
                                  Set as Member
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => changeRole(member, 'admin')}
                                  disabled={member.role === 'admin'}
                                >
                                  Set as Admin
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => changeRole(member, 'super_admin')}
                                  disabled={member.role === 'super_admin'}
                                  className="text-red-400"
                                >
                                  Set as Super Admin
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredMembers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No members found</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New Member</DialogTitle>
            <DialogDescription>
              Send an invitation email to add a new member to the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-name">Full Name</Label>
              <Input
                id="invite-name"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="honourable">Honourable</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  {isSuperAdmin && (
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={inviting}>
              {inviting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Invite
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
