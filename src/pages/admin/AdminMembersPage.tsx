import { useEffect, useState } from 'react';
import {
  Users,
  Search,
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
  mem_id: number;
  auth_user_id: string | null;
  fullname: string;
  username: string;
  phone: string;
  batch: number | null;
  created_at: string;
  role: string;
  designation: string;
  // Legacy flags kept for UI continuity; members table does not provide these.
  is_active?: boolean;
  can_submit_finance?: boolean;
}

type RawMember = Pick<
  Member,
  'mem_id' | 'auth_user_id' | 'fullname' | 'username' | 'phone' | 'batch' | 'created_at' | 'role' | 'designation'
>;

export default function AdminMembersPage() {
  const { isSuperAdmin } = useAdminAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBatch, setFilterBatch] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');

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
      const { data, error } = await supabase
        // Cast to any until generated types include the new members table.
        .from('members' as any)
        .select(
          'mem_id, auth_user_id, fullname, username, phone, batch, created_at, role, designation'
        )
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rows = ((data ?? []) as unknown) as RawMember[];
      const normalized: Member[] = rows.map((m) => ({
        ...m,
        // Keep legacy flags defined to avoid UI undefined access; server table lacks these.
        is_active: true,
        can_submit_finance: false,
      }));

      setMembers(normalized as Member[]);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Failed to fetch members');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async () => {
    toast.error('Activation toggle is not supported with the current members schema.');
  };

  const toggleFinancePermission = async () => {
    toast.error('Finance permission toggle is not supported with the current members schema.');
  };

  const changeRole = async (member: Member, newRole: string) => {
    if (!isSuperAdmin && newRole === 'super_admin') {
      toast.error('Only super admins can assign super admin role');
      return;
    }

    try {
      const { error } = await supabase
        .from('members' as any)
        .update({ role: newRole as any })
        .eq('mem_id', member.mem_id);

      if (error) throw error;

      setMembers((prev) =>
        prev.map((m) =>
          m.mem_id === member.mem_id ? { ...m, role: newRole } : m
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
      member.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBatch =
      filterBatch === 'all' || String(member.batch) === filterBatch;
    const matchesRole = filterRole === 'all' || member.role === filterRole;
    return matchesSearch && matchesBatch && matchesRole;
  });

  const uniqueBatches = [...new Set(members.map((m) => m.batch).filter((b) => b !== null))];

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
                  <SelectItem key={batch} value={String(batch)}>
                    {batch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-[180px] bg-background/50">
                <SelectValue placeholder="Everyone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Everyone</SelectItem>
                <SelectItem value="member">Members</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
                <SelectItem value="honourable">Honourables</SelectItem>
                <SelectItem value="super_admin">Super Admins</SelectItem>
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
                    <TableRow key={member.mem_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{member.fullname}</p>
                          <p className="text-sm text-muted-foreground">
                            {member.username}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{member.batch ?? '-'}</TableCell>
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
                              onClick={() => toggleActive()}
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
                              onClick={() => toggleFinancePermission()}
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
