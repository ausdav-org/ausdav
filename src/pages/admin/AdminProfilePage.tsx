import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Shield, Save, Loader2, UploadCloud } from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

export default function AdminProfilePage() {
  const { profile, role, refreshProfile } = useAdminAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [formData, setFormData] = useState({
    fullname: profile?.fullname || '',
    username: profile?.username || '',
    nic: profile?.nic || '',
    gender: profile?.gender ? 'male' : 'female',
    batch: profile?.batch?.toString() || '',
    university: profile?.university || '',
    school: profile?.school || '',
    phone: profile?.phone || '',
  });

  useEffect(() => {
    const loadSignedAvatar = async () => {
      if (!profile?.profile_path) {
        setAvatarUrl(undefined);
        return;
      }
      const { data, error } = await supabase.storage
        .from('member-profiles')
        .createSignedUrl(profile.profile_path, 60 * 60); // 1 hour
      if (error) {
        setAvatarUrl(undefined);
        return;
      }
      setAvatarUrl(data?.signedUrl);
    };

    loadSignedAvatar();
  }, [profile?.profile_path]);

  const handleSave = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('members' as any)
        .update({
          fullname: formData.fullname,
          username: formData.username,
          nic: formData.nic,
          gender: formData.gender === 'male',
          batch: Number(formData.batch),
          university: formData.university,
          school: formData.school,
          phone: formData.phone,
        } as any)
        .eq('mem_id', profile.mem_id);

      if (error) throw error;

      await refreshProfile();
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const initials = profile?.fullname
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U';

  const getRoleBadgeColor = (role: string | null) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'admin':
        return 'bg-primary/20 text-primary border-primary/30';
      case 'member':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'honourable':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!profile) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${profile.auth_user_id || profile.mem_id}/avatar-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('member-profiles')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('members' as any)
        .update({ profile_path: path })
        .eq('mem_id', profile.mem_id);

      if (updateError) throw updateError;

      await refreshProfile();
      toast.success('Profile picture updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <AdminHeader title="Profile" breadcrumb="Settings" />

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Profile Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex flex-col items-center gap-2">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <label className="inline-flex items-center gap-2 text-sm text-primary cursor-pointer">
                    <UploadCloud className="h-4 w-4" />
                    <span>{uploading ? 'Uploading...' : 'Change photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleAvatarUpload(file);
                      }}
                    />
                  </label>
                </div>
                <div className="text-center md:text-left">
                  <h2 className="text-2xl font-bold">{profile?.fullname || 'User'}</h2>
                  <p className="text-muted-foreground">{profile?.username}</p>
                  <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
                    <Badge className={cn('capitalize', getRoleBadgeColor(role))}>
                      {role?.replace('_', ' ') || 'Unknown'}
                    </Badge>
                    <Badge className="bg-muted text-muted-foreground border-border">{profile?.designation}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Edit Profile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Edit Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullname">Full Name</Label>
                  <Input
                    id="fullname"
                    value={formData.fullname}
                    onChange={(e) =>
                      setFormData({ ...formData, fullname: e.target.value })
                    }
                    placeholder="Enter your full name"
                    className="bg-background/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    placeholder="your.username"
                    className="bg-background/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nic">NIC</Label>
                  <Input
                    id="nic"
                    value={formData.nic}
                    onChange={(e) =>
                      setFormData({ ...formData, nic: e.target.value })
                    }
                    placeholder="NIC number"
                    className="bg-background/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value: 'male' | 'female') =>
                      setFormData({ ...formData, gender: value })
                    }
                  >
                    <SelectTrigger id="gender" className="bg-background/50">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="batch">Batch / Year</Label>
                  <Input
                    id="batch"
                    value={formData.batch}
                    onChange={(e) =>
                      setFormData({ ...formData, batch: e.target.value })
                    }
                    placeholder="e.g., 2024"
                    className="bg-background/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="university">University</Label>
                  <Input
                    id="university"
                    value={formData.university}
                    onChange={(e) =>
                      setFormData({ ...formData, university: e.target.value })
                    }
                    placeholder="University name"
                    className="bg-background/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="school">School</Label>
                  <Input
                    id="school"
                    value={formData.school}
                    onChange={(e) =>
                      setFormData({ ...formData, school: e.target.value })
                    }
                    placeholder="School name"
                    className="bg-background/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+94 XX XXX XXXX"
                    className="bg-background/50"
                  />
                </div>

                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className="w-full mt-4"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Role / designation summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Role & Designation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                  <div>
                    <p className="font-medium">Role</p>
                    <p className="text-sm text-muted-foreground">Assigned by administrators</p>
                  </div>
                  <Badge className={cn('capitalize', getRoleBadgeColor(role))}>
                    {role?.replace('_', ' ') || 'member'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                  <div>
                    <p className="font-medium">Designation</p>
                    <p className="text-sm text-muted-foreground">Managed by admins</p>
                  </div>
                  <Badge className="bg-muted text-muted-foreground border-border">
                    {profile?.designation || 'none'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Contact a super admin to update role or designation.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
