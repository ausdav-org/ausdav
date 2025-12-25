import { useEffect, useState, useMemo } from 'react';
import {
  UserPlus,
  Search,
  MoreVertical,
  Upload,
  Download,
  Loader2,
  FileText,
  Trash2,
  Users,
  TrendingUp,
  ArrowUpDown,
  Save,
  RotateCcw,
  Settings2,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { PermissionGate } from '@/components/admin/PermissionGate';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, Legend } from 'recharts';

type AppSettings = {
  allow_results_view: boolean;

  // ✅ subject-specific ranges saved as default
  phy_grade_a_min?: number | null;
  phy_grade_b_min?: number | null;
  phy_grade_c_min?: number | null;
  phy_grade_s_min?: number | null;

  che_grade_a_min?: number | null;
  che_grade_b_min?: number | null;
  che_grade_c_min?: number | null;
  che_grade_s_min?: number | null;

  bio_grade_a_min?: number | null;
  bio_grade_b_min?: number | null;
  bio_grade_c_min?: number | null;
  bio_grade_s_min?: number | null;

  maths_grade_a_min?: number | null;
  maths_grade_b_min?: number | null;
  maths_grade_c_min?: number | null;
  maths_grade_s_min?: number | null;
};

interface Applicant {
  applicant_id: number;
  index_no: string;
  fullname: string;
  stream: string;
  maths_or_bio: string | number | null;
  physics: string | number | null;
  chemistry: string | number | null;
  zscore: string | number | null;
  rank: string | number | null;

  maths_or_bio_result?: string | null;
  physics_result?: string | null;
  chemistry_result?: string | null;

  gender: boolean;
  nic: string;
  phone: string | null;
  email: string | null;
  school: string;

  created_at: string;
  year: number;
}

type GradeRanges = {
  A_min: number;
  B_min: number;
  C_min: number;
  S_min: number;
};

type SubjectKey = 'physics' | 'chemistry' | 'bio' | 'maths';

const DEFAULT_SL_RANGES: GradeRanges = { A_min: 75, B_min: 65, C_min: 55, S_min: 35 };

function toNumberOrNull(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const s = String(v).trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function fmt(v: unknown): string {
  if (v === null || v === undefined || String(v).trim() === '') return '-';
  return String(v);
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ',' && !inQuotes) {
      out.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }

  out.push(cur.trim());
  return out;
}

function validateRanges(r: GradeRanges): string | null {
  const vals = [r.A_min, r.B_min, r.C_min, r.S_min];
  if (vals.some((x) => !Number.isFinite(x))) return 'All ranges must be numbers';
  if (vals.some((x) => x < 0 || x > 100)) return 'Ranges must be between 0 and 100';
  if (!(r.A_min > r.B_min && r.B_min > r.C_min && r.C_min > r.S_min)) return 'Must be A > B > C > S';
  return null;
}

function gradeFromMark(mark: unknown, ranges: GradeRanges): 'A' | 'B' | 'C' | 'S' | 'F' | '-' {
  const n = toNumberOrNull(mark);
  if (n === null) return '-';
  if (n >= ranges.A_min) return 'A';
  if (n >= ranges.B_min) return 'B';
  if (n >= ranges.C_min) return 'C';
  if (n >= ranges.S_min) return 'S';
  return 'F';
}

type SortMode = 'default' | 'rank_asc' | 'rank_desc';

function makeBellCurveBuckets(values: number[]) {
  const buckets: Record<string, number> = {};
  for (let i = 0; i <= 100; i += 10) {
    const label = `${i}-${i + 9}`;
    buckets[label] = 0;
  }
  buckets['100'] = 0;

  for (const v of values) {
    const n = Math.max(0, Math.min(100, Math.round(v)));
    if (n === 100) {
      buckets['100'] += 1;
      continue;
    }
    const start = Math.floor(n / 10) * 10;
    const label = `${start}-${start + 9}`;
    buckets[label] += 1;
  }

  const order: string[] = [];
  for (let i = 0; i <= 90; i += 10) order.push(`${i}-${i + 9}`);
  order.push('100');

  return order.map((name) => ({ name, count: buckets[name] || 0 }));
}

export default function AdminApplicantsPage() {
  const { isAdmin, isSuperAdmin } = useAdminAuth();
  const canManageSettings = isAdmin || isSuperAdmin; // ✅ publish/grade ranges same behavior for admin + super admin

  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStream, setFilterStream] = useState<string>('all');
  const [filterGender, setFilterGender] = useState<string>('all');
  const [filterSchool, setFilterSchool] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const [allowResultsView, setAllowResultsView] = useState<boolean | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [resultsSaving, setResultsSaving] = useState(false);

  const [selectedSubjectForGrade, setSelectedSubjectForGrade] = useState<SubjectKey>('physics');

  const [gradeRangesDraftBySubject, setGradeRangesDraftBySubject] = useState<Record<SubjectKey, GradeRanges>>({
    physics: DEFAULT_SL_RANGES,
    chemistry: DEFAULT_SL_RANGES,
    bio: DEFAULT_SL_RANGES,
    maths: DEFAULT_SL_RANGES,
  });
  const [gradeRangesAppliedBySubject, setGradeRangesAppliedBySubject] = useState<Record<SubjectKey, GradeRanges>>({
    physics: DEFAULT_SL_RANGES,
    chemistry: DEFAULT_SL_RANGES,
    bio: DEFAULT_SL_RANGES,
    maths: DEFAULT_SL_RANGES,
  });
  const [rangesSaving, setRangesSaving] = useState(false);

  const [sortMode, setSortMode] = useState<SortMode>('default');

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);

  const uniqueYears = useMemo(() => {
    return [...new Set(applicants.map((a) => a.year))].sort((a, b) => b - a);
  }, [applicants]);

  useEffect(() => {
    if (uniqueYears.length > 0 && selectedYear === null) {
      setSelectedYear(uniqueYears[0]);
    }
  }, [uniqueYears, selectedYear]);

  useEffect(() => {
    fetchApplicants();
    loadResultsSetting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadResultsSetting = async () => {
    setSettingsLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_settings' as any)
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (error) throw error;

      const settings = data as unknown as AppSettings | null;
      setAllowResultsView(settings?.allow_results_view ?? false);

      const loadedBySubject: Record<SubjectKey, GradeRanges> = {
        physics: {
          A_min: Number(settings?.phy_grade_a_min ?? DEFAULT_SL_RANGES.A_min),
          B_min: Number(settings?.phy_grade_b_min ?? DEFAULT_SL_RANGES.B_min),
          C_min: Number(settings?.phy_grade_c_min ?? DEFAULT_SL_RANGES.C_min),
          S_min: Number(settings?.phy_grade_s_min ?? DEFAULT_SL_RANGES.S_min),
        },
        chemistry: {
          A_min: Number(settings?.che_grade_a_min ?? DEFAULT_SL_RANGES.A_min),
          B_min: Number(settings?.che_grade_b_min ?? DEFAULT_SL_RANGES.B_min),
          C_min: Number(settings?.che_grade_c_min ?? DEFAULT_SL_RANGES.C_min),
          S_min: Number(settings?.che_grade_s_min ?? DEFAULT_SL_RANGES.S_min),
        },
        bio: {
          A_min: Number(settings?.bio_grade_a_min ?? DEFAULT_SL_RANGES.A_min),
          B_min: Number(settings?.bio_grade_b_min ?? DEFAULT_SL_RANGES.B_min),
          C_min: Number(settings?.bio_grade_c_min ?? DEFAULT_SL_RANGES.C_min),
          S_min: Number(settings?.bio_grade_s_min ?? DEFAULT_SL_RANGES.S_min),
        },
        maths: {
          A_min: Number(settings?.maths_grade_a_min ?? DEFAULT_SL_RANGES.A_min),
          B_min: Number(settings?.maths_grade_b_min ?? DEFAULT_SL_RANGES.B_min),
          C_min: Number(settings?.maths_grade_c_min ?? DEFAULT_SL_RANGES.C_min),
          S_min: Number(settings?.maths_grade_s_min ?? DEFAULT_SL_RANGES.S_min),
        },
      };

      setGradeRangesDraftBySubject(loadedBySubject);
      setGradeRangesAppliedBySubject(loadedBySubject);
    } catch (error) {
      console.error('Error loading setting:', error);
      toast.error('Failed to load publish setting');
      setAllowResultsView(false);
      setGradeRangesDraftBySubject({
        physics: DEFAULT_SL_RANGES,
        chemistry: DEFAULT_SL_RANGES,
        bio: DEFAULT_SL_RANGES,
        maths: DEFAULT_SL_RANGES,
      });
      setGradeRangesAppliedBySubject({
        physics: DEFAULT_SL_RANGES,
        chemistry: DEFAULT_SL_RANGES,
        bio: DEFAULT_SL_RANGES,
        maths: DEFAULT_SL_RANGES,
      });
    } finally {
      setSettingsLoading(false);
    }
  };

  // ✅ publish button behavior same for admin + super admin (no “stuck”)
  const toggleResultsSetting = async () => {
    if (allowResultsView === null || resultsSaving) return;
    if (!canManageSettings) return;

    const next = !allowResultsView;
    setResultsSaving(true);
    setAllowResultsView(next);

    try {
      const { error } = await supabase
        .from('app_settings' as any)
        .update({ allow_results_view: next })
        .eq('id', 1);

      if (error) throw error;

      toast.success(next ? 'Results published' : 'Results unpublished');
    } catch (error) {
      console.error('Error updating setting:', error);
      setAllowResultsView(!next);
      toast.error('Failed to update publish setting');
    } finally {
      await loadResultsSetting();
      setResultsSaving(false);
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

  const yearApplicants = useMemo(() => {
    if (selectedYear === null) return [];
    return applicants.filter((a) => a.year === selectedYear);
  }, [applicants, selectedYear]);

  const zScoreMap = useMemo(() => {
    const totals: Array<{ id: number; total: number }> = [];
    for (const a of yearApplicants) {
      const m = toNumberOrNull(a.maths_or_bio);
      const p = toNumberOrNull(a.physics);
      const c = toNumberOrNull(a.chemistry);
      if (m === null || p === null || c === null) continue;
      totals.push({ id: a.applicant_id, total: m + p + c });
    }
    if (totals.length === 0) return new Map<number, string>();

    const mean = totals.reduce((s, t) => s + t.total, 0) / totals.length;
    const variance = totals.reduce((s, t) => s + Math.pow(t.total - mean, 2), 0) / totals.length;
    const std = Math.sqrt(variance);

    const map = new Map<number, string>();
    for (const t of totals) {
      const z = std === 0 ? 0 : (t.total - mean) / std;
      map.set(t.id, Number.isFinite(z) ? z.toFixed(4) : '-');
    }
    return map;
  }, [yearApplicants]);

  const filteredApplicants = useMemo(() => {
    const base = yearApplicants.filter((applicant) => {
      const q = searchQuery.toLowerCase();

      const matchesSearch =
        applicant.fullname.toLowerCase().includes(q) ||
        applicant.index_no.toLowerCase().includes(q) ||
        applicant.email?.toLowerCase().includes(q) ||
        applicant.school.toLowerCase().includes(q) ||
        String(applicant.nic).toLowerCase().includes(q);

      const matchesStream = filterStream === 'all' || applicant.stream === filterStream;
      const matchesGender =
        filterGender === 'all' ||
        (filterGender === 'male' && applicant.gender) ||
        (filterGender === 'female' && !applicant.gender);

      const matchesSchool = filterSchool === 'all' || applicant.school === filterSchool;

      return matchesSearch && matchesStream && matchesGender && matchesSchool;
    });

    const sorted = [...base];
    if (sortMode === 'rank_asc') {
      sorted.sort((a, b) => (toNumberOrNull(a.rank) ?? Infinity) - (toNumberOrNull(b.rank) ?? Infinity));
    } else if (sortMode === 'rank_desc') {
      sorted.sort((a, b) => (toNumberOrNull(b.rank) ?? -Infinity) - (toNumberOrNull(a.rank) ?? -Infinity));
    }
    return sorted;
  }, [yearApplicants, searchQuery, filterStream, filterGender, filterSchool, sortMode]);

  const uniqueStreams = useMemo(() => [...new Set(yearApplicants.map((a) => a.stream))], [yearApplicants]);
  const uniqueSchools = useMemo(() => [...new Set(yearApplicants.map((a) => a.school))], [yearApplicants]);

  const stats = useMemo(() => {
    const maleCount = filteredApplicants.filter((a) => a.gender).length;
    const femaleCount = filteredApplicants.filter((a) => !a.gender).length;

    const buckets = [
      { name: '< 0.00', min: -Infinity, max: 0 },
      { name: '0.00–0.99', min: 0, max: 1 },
      { name: '1.00–1.99', min: 1, max: 2 },
      { name: '2.00–2.99', min: 2, max: 3 },
      { name: '≥ 3.00', min: 3, max: Infinity },
      { name: 'Not Available', min: NaN, max: NaN },
    ];

    const zBucketCounts: Record<string, number> = {};
    buckets.forEach((b) => (zBucketCounts[b.name] = 0));

    filteredApplicants.forEach((a) => {
      const zString = zScoreMap.get(a.applicant_id);
      const z = zString ? Number(zString) : toNumberOrNull(a.zscore);

      if (z === null || Number.isNaN(z)) {
        zBucketCounts['Not Available'] += 1;
        return;
      }
      const b =
        z < 0 ? '< 0.00' :
        z < 1 ? '0.00–0.99' :
        z < 2 ? '1.00–1.99' :
        z < 3 ? '2.00–2.99' : '≥ 3.00';

      zBucketCounts[b] += 1;
    });

    const zScoreData = [
      { name: '< 0.00', count: zBucketCounts['< 0.00'] },
      { name: '0.00–0.99', count: zBucketCounts['0.00–0.99'] },
      { name: '1.00–1.99', count: zBucketCounts['1.00–1.99'] },
      { name: '2.00–2.99', count: zBucketCounts['2.00–2.99'] },
      { name: '≥ 3.00', count: zBucketCounts['≥ 3.00'] },
      { name: 'Not Available', count: zBucketCounts['Not Available'] },
    ];

    return { maleCount, femaleCount, zScoreData };
  }, [filteredApplicants, zScoreMap]);

  // ✅ Bell curve data: Bio and Maths SEPARATE series
  const bellCurveData = useMemo(() => {
    const mathsValues: number[] = [];
    const bioValues: number[] = [];
    const physicsValues: number[] = [];
    const chemistryValues: number[] = [];

    for (const a of filteredApplicants) {
      const m = toNumberOrNull(a.maths_or_bio);
      const p = toNumberOrNull(a.physics);
      const c = toNumberOrNull(a.chemistry);

      const isMathStream = String(a.stream || '').toLowerCase().includes('math');
      const isBioStream = String(a.stream || '').toLowerCase().includes('bio');

      if (m !== null) {
        if (isMathStream) mathsValues.push(m);
        else if (isBioStream) bioValues.push(m);
      }

      if (p !== null) physicsValues.push(p);
      if (c !== null) chemistryValues.push(c);
    }

    const mathsBuckets = makeBellCurveBuckets(mathsValues);
    const bioBuckets = makeBellCurveBuckets(bioValues);
    const phyBuckets = makeBellCurveBuckets(physicsValues);
    const cheBuckets = makeBellCurveBuckets(chemistryValues);

    const map = new Map<string, any>();

    for (const b of mathsBuckets) {
      map.set(b.name, { name: b.name, maths: b.count, bio: 0, physics: 0, chemistry: 0 });
    }
    for (const b of bioBuckets) {
      const row = map.get(b.name) ?? { name: b.name, maths: 0, bio: 0, physics: 0, chemistry: 0 };
      row.bio = b.count;
      map.set(b.name, row);
    }
    for (const b of phyBuckets) {
      const row = map.get(b.name) ?? { name: b.name, maths: 0, bio: 0, physics: 0, chemistry: 0 };
      row.physics = b.count;
      map.set(b.name, row);
    }
    for (const b of cheBuckets) {
      const row = map.get(b.name) ?? { name: b.name, maths: 0, bio: 0, physics: 0, chemistry: 0 };
      row.chemistry = b.count;
      map.set(b.name, row);
    }

    return Array.from(map.values());
  }, [filteredApplicants]);

  const bellCurveChartConfig: ChartConfig = {
    maths: { label: 'Maths', color: '#60A5FA' },
    bio: { label: 'Bio', color: '#A78BFA' },
    physics: { label: 'Physics', color: '#34D399' },
    chemistry: { label: 'Chemistry', color: '#FBBF24' },
  };

  const zScoreChartConfig: ChartConfig = {
    count: { label: 'Count', color: '#60A5FA' },
  };

  const downloadCsvTemplate = () => {
    const headers = ['index_no', 'maths_or_bio', 'physics', 'chemistry'];
    const csvContent = headers.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'marks_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadFilteredApplicantsCsv = () => {
    if (filteredApplicants.length === 0) {
      toast.error('No applicants to download');
      return;
    }

    const headers = [
      'index_no',
      'fullname',
      'stream',
      'maths_or_bio',
      'maths_or_bio_result',
      'physics',
      'physics_result',
      'chemistry',
      'chemistry_result',
      'zscore',
      'rank',
      'gender',
      'nic',
      'phone',
      'email',
      'school',
      'year',
      'created_at',
    ];

    const csvRows = [
      headers.join(','),
      ...filteredApplicants.map((a) => {
        const z = zScoreMap.get(a.applicant_id) ?? fmt(a.zscore);

        const phyRange = gradeRangesAppliedBySubject.physics;
        const cheRange = gradeRangesAppliedBySubject.chemistry;
        const mathsRange = gradeRangesAppliedBySubject.maths;
        const bioRange = gradeRangesAppliedBySubject.bio;

        const isMathStream = String(a.stream || '').toLowerCase().includes('math');
        const isBioStream = String(a.stream || '').toLowerCase().includes('bio');

        const bioMathRes =
          a.maths_or_bio_result ??
          (isMathStream
            ? gradeFromMark(a.maths_or_bio, mathsRange)
            : isBioStream
              ? gradeFromMark(a.maths_or_bio, bioRange)
              : gradeFromMark(a.maths_or_bio, bioRange));

        const phyRes = a.physics_result ?? gradeFromMark(a.physics, phyRange);
        const cheRes = a.chemistry_result ?? gradeFromMark(a.chemistry, cheRange);

        return ([
          `"${a.index_no}"`,
          `"${a.fullname}"`,
          `"${a.stream}"`,
          `"${fmt(a.maths_or_bio)}"`,
          `"${bioMathRes}"`,
          `"${fmt(a.physics)}"`,
          `"${phyRes}"`,
          `"${fmt(a.chemistry)}"`,
          `"${cheRes}"`,
          `"${z}"`,
          `"${fmt(a.rank)}"`,
          a.gender ? 'male' : 'female',
          `"${a.nic}"`,
          `"${a.phone || ''}"`,
          `"${a.email || ''}"`,
          `"${a.school}"`,
          a.year,
          `"${a.created_at}"`,
        ].join(','));
      }),
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

  const recalcZScoreAndRankForYear = async (year: number) => {
    const rows = applicants.filter((a) => a.year === year);

    const totals: Array<{ applicant_id: number; total: number }> = [];
    for (const a of rows) {
      const m = toNumberOrNull(a.maths_or_bio);
      const p = toNumberOrNull(a.physics);
      const c = toNumberOrNull(a.chemistry);
      if (m === null || p === null || c === null) continue;
      totals.push({ applicant_id: a.applicant_id, total: m + p + c });
    }

    if (totals.length === 0) return;

    const mean = totals.reduce((s, t) => s + t.total, 0) / totals.length;
    const variance = totals.reduce((s, t) => s + Math.pow(t.total - mean, 2), 0) / totals.length;
    const std = Math.sqrt(variance);

    const zRows = totals.map((t) => {
      const z = std === 0 ? 0 : (t.total - mean) / std;
      return { applicant_id: t.applicant_id, zscore: Number.isFinite(z) ? Number(z.toFixed(4)) : null };
    });

    const ranked = [...zRows]
      .filter((r) => r.zscore !== null)
      .sort((a, b) => (b.zscore ?? -Infinity) - (a.zscore ?? -Infinity))
      .map((r, idx) => ({ ...r, rank: idx + 1 }));

    const chunkSize = 120;
    for (let i = 0; i < zRows.length; i += chunkSize) {
      const chunk = zRows.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map((r) =>
          supabase
            .from('applicants' as any)
            .update({ zscore: r.zscore })
            .eq('applicant_id', r.applicant_id)
        )
      );
    }

    for (let i = 0; i < ranked.length; i += chunkSize) {
      const chunk = ranked.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map((r) =>
          supabase
            .from('applicants' as any)
            .update({ rank: r.rank })
            .eq('applicant_id', r.applicant_id)
        )
      );
    }
  };

  const regradeForYearBySubject = async (subject: SubjectKey, ranges: GradeRanges) => {
    if (selectedYear === null) return;
    const rows = applicants.filter((a) => a.year === selectedYear);

    const chunkSize = 120;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);

      await Promise.all(
        chunk.map((a) => {
          if (subject === 'physics') {
            const physics_result = gradeFromMark(a.physics, ranges);
            return supabase.from('applicants' as any).update({ physics_result }).eq('applicant_id', a.applicant_id);
          }

          if (subject === 'chemistry') {
            const chemistry_result = gradeFromMark(a.chemistry, ranges);
            return supabase.from('applicants' as any).update({ chemistry_result }).eq('applicant_id', a.applicant_id);
          }

          if (subject === 'maths') {
            const isMathStream = String(a.stream || '').toLowerCase().includes('math');
            if (!isMathStream) return Promise.resolve(null);
            const maths_or_bio_result = gradeFromMark(a.maths_or_bio, ranges);
            return supabase.from('applicants' as any).update({ maths_or_bio_result }).eq('applicant_id', a.applicant_id);
          }

          if (subject === 'bio') {
            const isBioStream = String(a.stream || '').toLowerCase().includes('bio');
            if (!isBioStream) return Promise.resolve(null);
            const maths_or_bio_result = gradeFromMark(a.maths_or_bio, ranges);
            return supabase.from('applicants' as any).update({ maths_or_bio_result }).eq('applicant_id', a.applicant_id);
          }

          return Promise.resolve(null);
        })
      );
    }
  };

  const saveGradeRanges = async () => {
    if (!canManageSettings) return toast.error('Only admins can change grade ranges');

    const subject = selectedSubjectForGrade;
    const draft = gradeRangesDraftBySubject[subject];
    const msg = validateRanges(draft);
    if (msg) return toast.error(msg);

    setRangesSaving(true);
    try {
      const payload: any = {};
      if (subject === 'physics') {
        payload.phy_grade_a_min = draft.A_min;
        payload.phy_grade_b_min = draft.B_min;
        payload.phy_grade_c_min = draft.C_min;
        payload.phy_grade_s_min = draft.S_min;
      } else if (subject === 'chemistry') {
        payload.che_grade_a_min = draft.A_min;
        payload.che_grade_b_min = draft.B_min;
        payload.che_grade_c_min = draft.C_min;
        payload.che_grade_s_min = draft.S_min;
      } else if (subject === 'bio') {
        payload.bio_grade_a_min = draft.A_min;
        payload.bio_grade_b_min = draft.B_min;
        payload.bio_grade_c_min = draft.C_min;
        payload.bio_grade_s_min = draft.S_min;
      } else if (subject === 'maths') {
        payload.maths_grade_a_min = draft.A_min;
        payload.maths_grade_b_min = draft.B_min;
        payload.maths_grade_c_min = draft.C_min;
        payload.maths_grade_s_min = draft.S_min;
      }

      const { error } = await supabase.from('app_settings' as any).update(payload).eq('id', 1);
      if (error) throw error;

      setGradeRangesAppliedBySubject((p) => ({ ...p, [subject]: draft }));

      await regradeForYearBySubject(subject, draft);
      toast.success('Saved ranges & regraded for selected subject');

      await fetchApplicants();
    } catch (e) {
      console.error(e);
      toast.error('Failed to save ranges');
    } finally {
      setRangesSaving(false);
    }
  };

  const resetGradeRanges = async () => {
    if (!canManageSettings) return toast.error('Only admins can reset grade ranges');

    const subject = selectedSubjectForGrade;
    setRangesSaving(true);
    try {
      setGradeRangesDraftBySubject((p) => ({ ...p, [subject]: DEFAULT_SL_RANGES }));
      setGradeRangesAppliedBySubject((p) => ({ ...p, [subject]: DEFAULT_SL_RANGES }));

      const payload: any = {};
      if (subject === 'physics') {
        payload.phy_grade_a_min = DEFAULT_SL_RANGES.A_min;
        payload.phy_grade_b_min = DEFAULT_SL_RANGES.B_min;
        payload.phy_grade_c_min = DEFAULT_SL_RANGES.C_min;
        payload.phy_grade_s_min = DEFAULT_SL_RANGES.S_min;
      } else if (subject === 'chemistry') {
        payload.che_grade_a_min = DEFAULT_SL_RANGES.A_min;
        payload.che_grade_b_min = DEFAULT_SL_RANGES.B_min;
        payload.che_grade_c_min = DEFAULT_SL_RANGES.C_min;
        payload.che_grade_s_min = DEFAULT_SL_RANGES.S_min;
      } else if (subject === 'bio') {
        payload.bio_grade_a_min = DEFAULT_SL_RANGES.A_min;
        payload.bio_grade_b_min = DEFAULT_SL_RANGES.B_min;
        payload.bio_grade_c_min = DEFAULT_SL_RANGES.C_min;
        payload.bio_grade_s_min = DEFAULT_SL_RANGES.S_min;
      } else if (subject === 'maths') {
        payload.maths_grade_a_min = DEFAULT_SL_RANGES.A_min;
        payload.maths_grade_b_min = DEFAULT_SL_RANGES.B_min;
        payload.maths_grade_c_min = DEFAULT_SL_RANGES.C_min;
        payload.maths_grade_s_min = DEFAULT_SL_RANGES.S_min;
      }

      const { error } = await supabase.from('app_settings' as any).update(payload).eq('id', 1);
      if (error) throw error;

      await regradeForYearBySubject(subject, DEFAULT_SL_RANGES);
      toast.success('Reset to Sri Lankan standard & regraded selected subject');

      await fetchApplicants();
    } catch (e) {
      console.error(e);
      toast.error('Failed to reset ranges');
    } finally {
      setRangesSaving(false);
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) {
      toast.error('Please select a CSV file');
      return;
    }
    if (selectedYear === null) {
      toast.error('Please select a year');
      return;
    }

    setUploading(true);
    try {
      const text = await csvFile.text();
      const lines = text.split(/\r?\n/).filter((line) => line.trim());
      const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());

      const expectedHeaders = ['index_no', 'maths_or_bio', 'physics', 'chemistry'];
      const headerMap: Record<string, number> = {};
      expectedHeaders.forEach((expected) => {
        const idx = headers.indexOf(expected);
        if (idx === -1) throw new Error(`Missing required column: ${expected}`);
        headerMap[expected] = idx;
      });

      const updates: Array<{
        index_no: string;
        maths_or_bio: string | number | null;
        physics: string | number | null;
        chemistry: string | number | null;
      }> = [];

      for (let i = 1; i < lines.length; i++) {
        const values = parseCsvLine(lines[i]);
        if (values.length < headers.length) continue;

        const index_no = (values[headerMap.index_no] ?? '').trim();
        if (!index_no) throw new Error(`Row ${i + 1}: index_no is required`);

        updates.push({
          index_no,
          maths_or_bio: (values[headerMap.maths_or_bio] ?? '').trim() || null,
          physics: (values[headerMap.physics] ?? '').trim() || null,
          chemistry: (values[headerMap.chemistry] ?? '').trim() || null,
        });
      }

      if (updates.length === 0) throw new Error('No valid records found in CSV');

      const chunkSize = 120;
      for (let i = 0; i < updates.length; i += chunkSize) {
        const chunk = updates.slice(i, i + chunkSize);

        await Promise.all(
          chunk.map(async (u) => {
            const found = applicants.find((a) => a.year === selectedYear && a.index_no === u.index_no);
            const isMathStream = String(found?.stream || '').toLowerCase().includes('math');
            const isBioStream = String(found?.stream || '').toLowerCase().includes('bio');

            const phyRanges = gradeRangesAppliedBySubject.physics;
            const cheRanges = gradeRangesAppliedBySubject.chemistry;
            const mathsRanges = gradeRangesAppliedBySubject.maths;
            const bioRanges = gradeRangesAppliedBySubject.bio;

            const maths_or_bio_result =
              isMathStream ? gradeFromMark(u.maths_or_bio, mathsRanges)
              : isBioStream ? gradeFromMark(u.maths_or_bio, bioRanges)
              : gradeFromMark(u.maths_or_bio, bioRanges);

            const physics_result = gradeFromMark(u.physics, phyRanges);
            const chemistry_result = gradeFromMark(u.chemistry, cheRanges);

            return supabase
              .from('applicants' as any)
              .update({
                maths_or_bio: u.maths_or_bio,
                physics: u.physics,
                chemistry: u.chemistry,
                maths_or_bio_result,
                physics_result,
                chemistry_result,
              })
              .eq('index_no', u.index_no)
              .eq('year', selectedYear);
          })
        );
      }

      await fetchApplicants();
      await recalcZScoreAndRankForYear(selectedYear);

      toast.success(`Successfully uploaded ${updates.length} marks rows`);
      setUploadOpen(false);
      setCsvFile(null);

      await fetchApplicants();
    } catch (error: any) {
      console.error('Error uploading CSV:', error);
      toast.error(error.message || 'Failed to upload CSV');
    } finally {
      setUploading(false);
    }
  };

  const handleBulkDeleteByYear = async () => {
    if (selectedYear === null) {
      toast.error('Please select a year');
      return;
    }

    const applicantsToDelete = applicants.filter((a) => a.year === selectedYear);
    if (applicantsToDelete.length === 0) {
      toast.error('No applicants to delete for this year');
      return;
    }

    try {
      const { error } = await supabase.from('applicants' as any).delete().eq('year', selectedYear);
      if (error) throw error;

      toast.success(`Successfully deleted ${applicantsToDelete.length} applicants from ${selectedYear}`);

      const remaining = applicants.filter((a) => a.year !== selectedYear);
      setApplicants(remaining);

      const remainingYears = [...new Set(remaining.map((a) => a.year))].sort((a, b) => b - a);
      setSelectedYear(remainingYears.length > 0 ? remainingYears[0] : null);
    } catch (error) {
      console.error('Error deleting applicants:', error);
      toast.error('Failed to delete applicants');
    }
  };

  const openDetails = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setDetailsOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const yearApplicantsCount = yearApplicants.length;

  const PageContent = (
    <div className="space-y-6">
      <AdminHeader title="Applicants Management" />

      {/* Year Selection + Publish Button */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-lg">Select Year</CardTitle>

              <Badge className={allowResultsView ? 'bg-blue-500/20 text-blue-500' : 'bg-muted text-muted-foreground'}>
                {settingsLoading ? 'Loading...' : allowResultsView ? 'Results Published' : 'Results Not Published'}
              </Badge>
            </div>

            <div className="flex gap-2">
              <Button
                // ✅ UPDATED: action-based color
                className={
                  allowResultsView
                    ? 'bg-red-600 hover:bg-red-700 text-white'   // Unpublish action = red
                    : 'bg-blue-600 hover:bg-blue-700 text-white' // Publish action = blue
                }
                size="sm"
                onClick={toggleResultsSetting}
                disabled={!canManageSettings || settingsLoading || resultsSaving || allowResultsView === null}
                title={canManageSettings ? undefined : 'Only admins can change this setting'}
              >
                {resultsSaving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                {allowResultsView ? 'Unpublish Results' : 'Publish Results'}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {uniqueYears.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No applicants found</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {uniqueYears.map((year) => {
                const yearCount = applicants.filter((a) => a.year === year).length;
                return (
                  <Button
                    key={year}
                    variant={selectedYear === year ? 'default' : 'outline'}
                    onClick={() => setSelectedYear(year)}
                    className="min-w-[100px]"
                  >
                    {year}
                    <Badge variant="secondary" className="ml-2 bg-background/20">
                      {yearCount}
                    </Badge>
                  </Button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedYear !== null && (
        <>
          {/* Filters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5" />
                Filters for {selectedYear}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, index, NIC, email, school..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select value={filterStream} onValueChange={setFilterStream}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Stream" />
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
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genders</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterSchool} onValueChange={setFilterSchool}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="School" />
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

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={downloadCsvTemplate}>
                    <Download className="h-4 w-4 mr-1" />
                    Template
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadFilteredApplicantsCsv}
                    disabled={filteredApplicants.length === 0}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export CSV
                  </Button>
                  <Button size="sm" onClick={() => setUploadOpen(true)}>
                    <Upload className="h-4 w-4 mr-1" />
                    Import
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Applicants</CardDescription>
                <CardTitle className="text-3xl flex items-center gap-2">
                  <Users className="h-6 w-6 text-primary" />
                  {filteredApplicants.length}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Male</CardDescription>
                <CardTitle className="text-3xl flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <span className="text-blue-500 text-sm font-bold">M</span>
                  </div>
                  {stats.maleCount}
                  <span className="text-sm font-normal text-muted-foreground">
                    ({filteredApplicants.length > 0 ? Math.round((stats.maleCount / filteredApplicants.length) * 100) : 0}%)
                  </span>
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Female</CardDescription>
                <CardTitle className="text-3xl flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-pink-500/20 flex items-center justify-center">
                    <span className="text-pink-500 text-sm font-bold">F</span>
                  </div>
                  {stats.femaleCount}
                  <span className="text-sm font-normal text-muted-foreground">
                    ({filteredApplicants.length > 0 ? Math.round((stats.femaleCount / filteredApplicants.length) * 100) : 0}%)
                  </span>
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Streams Represented</CardDescription>
                <CardTitle className="text-3xl flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                  {uniqueStreams.length}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bell Curve Distribution (Marks)</CardTitle>
                <CardDescription>Maths, Bio, Physics and Chemistry mark distribution by buckets</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={bellCurveChartConfig} className="h-[320px]">
                  <BarChart data={bellCurveData}>
                    <XAxis dataKey="name" tick={{ fill: 'hsl(var(--foreground))' }} />
                    <YAxis tick={{ fill: 'hsl(var(--foreground))' }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    {/* ✅ explicit fills so it always shows */}
                    <Bar dataKey="maths" fill="#60A5FA" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="bio" fill="#A78BFA" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="physics" fill="#34D399" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="chemistry" fill="#FBBF24" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Z-Score Distribution</CardTitle>
                <CardDescription>Bucketed distribution of applicants by Z-score</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.zScoreData.length > 0 ? (
                  <ChartContainer config={zScoreChartConfig} className="h-[300px]">
                    <BarChart data={stats.zScoreData} layout="vertical">
                      <XAxis type="number" tick={{ fill: 'hsl(var(--foreground))' }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={120}
                        tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="#60A5FA" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Grade Range Card with SUBJECT selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Set range for the grade
              </CardTitle>
              <CardDescription>
                Select a subject and set grade boundaries. Maths applies for Maths stream, Bio applies for Bio stream.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="w-52">
                  <Label>Subject</Label>
                  <Select value={selectedSubjectForGrade} onValueChange={(v) => setSelectedSubjectForGrade(v as SubjectKey)}>
                    <SelectTrigger className="w-52">
                      <SelectValue placeholder="Select Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="physics">Physics</SelectItem>
                      <SelectItem value="chemistry">Chemistry</SelectItem>
                      <SelectItem value="maths">Maths (Maths Stream)</SelectItem>
                      <SelectItem value="bio">Bio (Bio Stream)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Badge variant="secondary" className="h-9 flex items-center">
                  Applied: A≥{gradeRangesAppliedBySubject[selectedSubjectForGrade].A_min} | B≥{gradeRangesAppliedBySubject[selectedSubjectForGrade].B_min} | C≥{gradeRangesAppliedBySubject[selectedSubjectForGrade].C_min} | S≥{gradeRangesAppliedBySubject[selectedSubjectForGrade].S_min}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label>A minimum</Label>
                  <Input
                    type="number"
                    value={gradeRangesDraftBySubject[selectedSubjectForGrade].A_min}
                    onChange={(e) =>
                      setGradeRangesDraftBySubject((p) => ({
                        ...p,
                        [selectedSubjectForGrade]: { ...p[selectedSubjectForGrade], A_min: Number(e.target.value) },
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>B minimum</Label>
                  <Input
                    type="number"
                    value={gradeRangesDraftBySubject[selectedSubjectForGrade].B_min}
                    onChange={(e) =>
                      setGradeRangesDraftBySubject((p) => ({
                        ...p,
                        [selectedSubjectForGrade]: { ...p[selectedSubjectForGrade], B_min: Number(e.target.value) },
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>C minimum</Label>
                  <Input
                    type="number"
                    value={gradeRangesDraftBySubject[selectedSubjectForGrade].C_min}
                    onChange={(e) =>
                      setGradeRangesDraftBySubject((p) => ({
                        ...p,
                        [selectedSubjectForGrade]: { ...p[selectedSubjectForGrade], C_min: Number(e.target.value) },
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>S minimum</Label>
                  <Input
                    type="number"
                    value={gradeRangesDraftBySubject[selectedSubjectForGrade].S_min}
                    onChange={(e) =>
                      setGradeRangesDraftBySubject((p) => ({
                        ...p,
                        [selectedSubjectForGrade]: { ...p[selectedSubjectForGrade], S_min: Number(e.target.value) },
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                <Button onClick={saveGradeRanges} disabled={!canManageSettings || rangesSaving}>
                  {rangesSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>

                <Button variant="outline" onClick={resetGradeRanges} disabled={!canManageSettings || rangesSaving}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset (Sri Lankan Default)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Applicants Table */}
          <Card>
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Applicants List ({filteredApplicants.length})
              </CardTitle>

              <div className="flex gap-2">
                <Button
                  variant={sortMode === 'default' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortMode('default')}
                >
                  <ArrowUpDown className="h-4 w-4 mr-1" />
                  Default
                </Button>
                <Button
                  variant={sortMode === 'rank_asc' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortMode('rank_asc')}
                >
                  <ArrowUpDown className="h-4 w-4 mr-1" />
                  Rank ↑
                </Button>
                <Button
                  variant={sortMode === 'rank_desc' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortMode('rank_desc')}
                >
                  <ArrowUpDown className="h-4 w-4 mr-1" />
                  Rank ↓
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Index No</TableHead>
                      <TableHead>Stream</TableHead>

                      <TableHead>Bio/Maths</TableHead>
                      <TableHead>Bio/Maths Result</TableHead>

                      <TableHead>Physics</TableHead>
                      <TableHead>Physics Result</TableHead>

                      <TableHead>Chemistry</TableHead>
                      <TableHead>Chemistry Result</TableHead>

                      <TableHead>Z-Score</TableHead>
                      <TableHead>Rank</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredApplicants.map((a) => {
                      const z = zScoreMap.get(a.applicant_id) ?? fmt(a.zscore);

                      const isMathStream = String(a.stream || '').toLowerCase().includes('math');
                      const isBioStream = String(a.stream || '').toLowerCase().includes('bio');

                      const bioMathRes =
                        a.maths_or_bio_result ??
                        (isMathStream
                          ? gradeFromMark(a.maths_or_bio, gradeRangesAppliedBySubject.maths)
                          : isBioStream
                            ? gradeFromMark(a.maths_or_bio, gradeRangesAppliedBySubject.bio)
                            : gradeFromMark(a.maths_or_bio, gradeRangesAppliedBySubject.bio));

                      const phyRes = a.physics_result ?? gradeFromMark(a.physics, gradeRangesAppliedBySubject.physics);
                      const cheRes = a.chemistry_result ?? gradeFromMark(a.chemistry, gradeRangesAppliedBySubject.chemistry);

                      return (
                        <TableRow key={a.applicant_id}>
                          <TableCell className="font-medium">{a.index_no}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{a.stream}</Badge>
                          </TableCell>

                          <TableCell className="font-mono text-sm">{fmt(a.maths_or_bio)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{bioMathRes}</Badge>
                          </TableCell>

                          <TableCell className="font-mono text-sm">{fmt(a.physics)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{phyRes}</Badge>
                          </TableCell>

                          <TableCell className="font-mono text-sm">{fmt(a.chemistry)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{cheRes}</Badge>
                          </TableCell>

                          <TableCell className="font-mono text-sm">{z}</TableCell>
                          <TableCell className="font-mono text-sm">{fmt(a.rank)}</TableCell>

                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openDetails(a)}>
                                  <FileText className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {filteredApplicants.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No applicants found for the selected filters
                </div>
              )}
            </CardContent>
          </Card>

          {/* Danger Zone - ONLY SUPER ADMIN can see */}
          {isSuperAdmin && (
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-lg text-destructive flex items-center gap-2">
                  <Trash2 className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Permanently delete all applicants for {selectedYear}. This action cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full sm:w-auto">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete All {selectedYear} Applicants ({yearApplicantsCount})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all <strong>{yearApplicantsCount}</strong> applicants from year{' '}
                        <strong>{selectedYear}</strong>. This action cannot be undone and the data cannot be recovered.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleBulkDeleteByYear}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* CSV Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Applicants CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file with applicant marks data.
              Columns required: index_no, maths_or_bio, physics, chemistry.
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

      {/* View Details Dialog */}
      <Dialog
        open={detailsOpen}
        onOpenChange={(open) => {
          setDetailsOpen(open);
          if (!open) setSelectedApplicant(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Applicant Details</DialogTitle>
            <DialogDescription>Full details for the selected applicant.</DialogDescription>
          </DialogHeader>

          {selectedApplicant ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Basic</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Index No</span>
                    <span className="font-mono">{selectedApplicant.index_no}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Name</span>
                    <span className="text-right">{selectedApplicant.fullname}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Stream</span>
                    <span className="text-right">{selectedApplicant.stream}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Gender</span>
                    <span className="text-right">{selectedApplicant.gender ? 'Male' : 'Female'}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="text-right">{selectedApplicant.phone || '-'}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Email</span>
                    <span className="text-right">{selectedApplicant.email || '-'}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">School</span>
                    <span className="text-right">{selectedApplicant.school}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Scores</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                  <div className="p-3 rounded-lg border">
                    <div className="text-muted-foreground">Maths / Bio</div>
                    <div className="font-mono">{fmt(selectedApplicant.maths_or_bio)}</div>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <div className="text-muted-foreground">Physics</div>
                    <div className="font-mono">{fmt(selectedApplicant.physics)}</div>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <div className="text-muted-foreground">Chemistry</div>
                    <div className="font-mono">{fmt(selectedApplicant.chemistry)}</div>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <div className="text-muted-foreground">Z-Score</div>
                    <div className="font-mono">{fmt(selectedApplicant.zscore)}</div>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <div className="text-muted-foreground">Rank</div>
                    <div className="font-mono">{fmt(selectedApplicant.rank)}</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Identification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">NIC</span>
                    <span className="font-mono text-right">{selectedApplicant.nic}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Year</span>
                    <span className="text-right">{selectedApplicant.year}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Created</span>
                    <span className="text-right">
                      {new Date(selectedApplicant.created_at).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">No applicant selected</div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (isAdmin) return PageContent;

  return (
    <PermissionGate permissionKey="applicant" permissionName="Applicant Handling">
      {PageContent}
    </PermissionGate>
  );
}
