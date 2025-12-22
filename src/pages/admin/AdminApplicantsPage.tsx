import { useEffect, useState } from 'react';
import {
  UserPlus,
  Search,
  MoreVertical,
  Upload,
  Download,
  Loader2,
  FileText,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { PermissionGate } from '@/components/admin/PermissionGate';
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

type AppSettings = {
  allow_exam_applications: boolean;
};

interface Applicant {
  applicant_id: number;
  index_no: string;
  fullname: string;
  gender: boolean;
  stream: string;
  nic: string;
  phone: string | null;
  email: string | null;
  school: string;
  results: string | null;
  created_at: string;
  year: number;
}

export default function AdminApplicantsPage() {
  const { isSuperAdmin } = useAdminAuth();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStream, setFilterStream] = useState<string>('all');
  const [filterGender, setFilterGender] = useState<string>('all');
  const [filterSchool, setFilterSchool] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [allowExamApplications, setAllowExamApplications] = useState<boolean | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // CSV Upload dialog
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  useEffect(() => {
    fetchApplicants();
    loadExamSetting();
  }, []);

  const loadExamSetting = async () => {
    setSettingsLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_settings' as any)
        .select('allow_exam_applications')
        .eq('id', 1)
        .maybeSingle<AppSettings>();

      if (error) throw error;
      setAllowExamApplications(data?.allow_exam_applications ?? false);
    } catch (error) {
      console.error('Error loading exam setting:', error);
      toast.error('Failed to load exam application setting');
    } finally {
      setSettingsLoading(false);
    }
  };

  const toggleExamSetting = async () => {
    if (allowExamApplications === null || settingsSaving) return;
    setSettingsSaving(true);
    try {
      const { data, error } = await supabase
        .from('app_settings' as any)
        .update({ allow_exam_applications: !allowExamApplications })
        .eq('id', 1)
        .select('allow_exam_applications')
        .maybeSingle<AppSettings>();

      if (error) throw error;
      setAllowExamApplications(data?.allow_exam_applications ?? false);
      toast.success(data?.allow_exam_applications ? 'Exam applications opened' : 'Exam applications closed');
    } catch (error) {
      console.error('Error updating exam setting:', error);
      toast.error('Failed to update exam application setting');
    } finally {
      setSettingsSaving(false);
    }
  };

  const fetchApplicants = async () => {
    try {
      const { data, error } = await supabase
        .from('applicants' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplicants((data as unknown as Applicant[]) || []);
    } catch (error) {
      console.error('Error fetching applicants:', error);
      toast.error('Failed to fetch applicants');
    } finally {
      setLoading(false);
    }
  };

  const filteredApplicants = applicants.filter((applicant) => {
    const matchesSearch =
      applicant.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      applicant.index_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      applicant.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      applicant.school.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStream = filterStream === 'all' || applicant.stream === filterStream;
    const matchesGender = filterGender === 'all' || 
      (filterGender === 'male' && applicant.gender) || 
      (filterGender === 'female' && !applicant.gender);
    const matchesSchool = filterSchool === 'all' || applicant.school === filterSchool;
    const matchesYear = filterYear === 'all' || applicant.year.toString() === filterYear;

    return matchesSearch && matchesStream && matchesGender && matchesSchool && matchesYear;
  });

  const uniqueStreams = [...new Set(applicants.map(a => a.stream))];
  const uniqueSchools = [...new Set(applicants.map(a => a.school))];
  const uniqueYears = [...new Set(applicants.map(a => a.year))].sort((a, b) => b - a);

  const handleCsvUpload = async () => {
    if (!csvFile) {
      toast.error('Please select a CSV file');
      return;
    }

    setUploading(true);
    try {
      const text = await csvFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

      // Expected headers: index_no,fullname,gender,stream,nic,phone,email,school,results
      const expectedHeaders = ['index_no', 'fullname', 'gender', 'stream', 'nic', 'phone', 'email', 'school', 'results'];
      const headerMap: { [key: string]: number } = {};

      expectedHeaders.forEach(expected => {
        const index = headers.indexOf(expected);
        if (index === -1) {
          throw new Error(`Missing required column: ${expected}`);
        }
        headerMap[expected] = index;
      });

      const records = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length !== headers.length) continue; // Skip malformed lines

        const record = {
          index_no: values[headerMap.index_no],
          fullname: values[headerMap.fullname],
          gender: values[headerMap.gender].toLowerCase() === 'male' || values[headerMap.gender] === '1' || values[headerMap.gender].toLowerCase() === 'true',
          stream: values[headerMap.stream],
          nic: values[headerMap.nic],
          phone: values[headerMap.phone] || null,
          email: values[headerMap.email] || null,
          school: values[headerMap.school],
          results: values[headerMap.results] || null,
        };

        records.push(record);
      }

      if (records.length === 0) {
        throw new Error('No valid records found in CSV');
      }

      const { error } = await supabase
        .from('applicants' as any)
        .insert(records);

      if (error) throw error;

      toast.success(`Successfully uploaded ${records.length} applicants`);
      setUploadOpen(false);
      setCsvFile(null);
      fetchApplicants();
    } catch (error: any) {
      console.error('Error uploading CSV:', error);
      toast.error(error.message || 'Failed to upload CSV');
    } finally {
      setUploading(false);
    }
  };

  const downloadCsvTemplate = () => {
    const headers = ['index_no', 'fullname', 'gender', 'stream', 'nic', 'phone', 'email', 'school', 'results'];
    const csvContent = headers.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'applicants_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadFilteredApplicantsCsv = () => {
    if (filteredApplicants.length === 0) {
      toast.error('No applicants to download');
      return;
    }

    const headers = ['index_no', 'fullname', 'gender', 'stream', 'nic', 'phone', 'email', 'school', 'results', 'year', 'created_at'];
    const csvRows = [
      headers.join(','),
      ...filteredApplicants.map(applicant => [
        `"${applicant.index_no}"`,
        `"${applicant.fullname}"`,
        applicant.gender ? 'male' : 'female',
        `"${applicant.stream}"`,
        `"${applicant.nic}"`,
        `"${applicant.phone || ''}"`,
        `"${applicant.email || ''}"`,
        `"${applicant.school}"`,
        `"${applicant.results || ''}"`,
        applicant.year,
        `"${applicant.created_at}"`
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applicants_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filteredApplicants.length} applicants`);
  };

  const handleBulkDeleteByYear = async () => {
    if (filteredApplicants.length === 0) {
      toast.error('No applicants to delete');
      return;
    }

    const yearToDelete = filterYear === 'all' ? 'all years' : filterYear;
    if (!confirm(`Are you sure you want to delete ${filteredApplicants.length} applicants from ${yearToDelete}? This action cannot be undone.`)) {
      return;
    }

    try {
      const idsToDelete = filteredApplicants.map(a => a.applicant_id);
      const { error } = await supabase
        .from('applicants' as any)
        .delete()
        .in('applicant_id', idsToDelete);

      if (error) throw error;

      toast.success(`Successfully deleted ${filteredApplicants.length} applicants from ${yearToDelete}`);
      fetchApplicants();
    } catch (error) {
      console.error('Error deleting applicants:', error);
      toast.error('Failed to delete applicants');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <PermissionGate permissionKey="applicant" permissionName="Applicant Handling">
      <div className="space-y-6">
        <AdminHeader
          title="Applicants Management"
        />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Applicants ({filteredApplicants.length})
              </CardTitle>
              <Badge className={allowExamApplications ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'}>
                {settingsLoading ? 'Loading...' : allowExamApplications ? 'Exam Applications Open' : 'Exam Applications Closed'}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                variant={allowExamApplications ? 'destructive' : 'default'}
                onClick={toggleExamSetting}
                disabled={!isSuperAdmin || settingsLoading || settingsSaving || allowExamApplications === null}
                title={isSuperAdmin ? undefined : 'Only super admins can change this setting'}
                className="flex items-center gap-2"
              >
                {settingsSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {allowExamApplications ? 'Close Exam Applications' : 'Open Exam Applications'}
              </Button>
              <Button
                variant="destructive"
                onClick={handleBulkDeleteByYear}
                disabled={filteredApplicants.length === 0}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Delete Filtered ({filteredApplicants.length})
              </Button>
              <Button
                variant="outline"
                onClick={downloadCsvTemplate}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Template
              </Button>
              <Button
                variant="outline"
                onClick={downloadFilteredApplicantsCsv}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download CSV
              </Button>
              <Button
                onClick={() => setUploadOpen(true)}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search applicants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStream} onValueChange={setFilterStream}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by stream" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Streams</SelectItem>
                {uniqueStreams.map((stream) => (
                  <SelectItem key={stream} value={stream}>
                    {stream}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterGender} onValueChange={setFilterGender}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSchool} onValueChange={setFilterSchool}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by school" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Schools</SelectItem>
                {uniqueSchools.map((school) => (
                  <SelectItem key={school} value={school}>
                    {school}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {uniqueYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Index No</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Stream</TableHead>
                  <TableHead>NIC</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Results</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplicants.map((applicant) => (
                  <TableRow key={applicant.applicant_id}>
                    <TableCell className="font-medium">{applicant.index_no}</TableCell>
                    <TableCell>{applicant.fullname}</TableCell>
                    <TableCell>
                      <Badge variant={applicant.gender ? 'default' : 'secondary'}>
                        {applicant.gender ? 'Male' : 'Female'}
                      </Badge>
                    </TableCell>
                    <TableCell>{applicant.stream}</TableCell>
                    <TableCell>{applicant.nic}</TableCell>
                    <TableCell>{applicant.phone || '-'}</TableCell>
                    <TableCell>{applicant.email || '-'}</TableCell>
                    <TableCell>{applicant.school}</TableCell>
                    <TableCell>{applicant.results || '-'}</TableCell>
                    <TableCell>{applicant.year}</TableCell>
                    <TableCell>
                      {new Date(applicant.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <FileText className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredApplicants.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No applicants found
            </div>
          )}
        </CardContent>
      </Card>

      {/* CSV Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Applicants CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file with applicant data. The file should have the following columns:
              index_no, fullname, gender, stream, nic, phone, email, school, results
              (year will be automatically set based on creation date)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="csv-file">CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCsvUpload} disabled={uploading}>
              {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </PermissionGate>
  );
}