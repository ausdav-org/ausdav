import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FileText, Download, Search, ClipboardList, Award, ImageDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import emblemImg from '@/assets/Exam/AUSDAV logo.png';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

type AppSettings = {
  allow_exam_applications: boolean;
  allow_results_view: boolean;
};

const MOCK_RESULTS = {
  'Maths|2024|Index No|1234': {
    name: 'Kumar',
    school: 'Vtmmv',
    Nic_no: '200333110288',
    physics_grade: 'A',
    Maths_grade: 'A',
    Chemistry_grade: 'B',
    rank: 45,
  },
} as const;

type ResultRow = (typeof MOCK_RESULTS)[keyof typeof MOCK_RESULTS];

type PastPaper = {
  pp_id: number;
  yrs: number;
  subject: string;
  exam_paper_bucket: string;
  exam_paper_path: string | null;
  scheme_bucket: string;
  scheme_path: string | null;
  created_at: string;
  updated_at: string;
};

// Apply form options
const applyExams = ['-- Select Your Stream --', 'Maths', 'Biology'];
const schoolOptions = [
  'Vavniya Tamil Madhya Maha Vidyalayam',
  "V/Rambaikulam girls' maha vidyalayam",
  'Saivapragasa Ladies College',
  'Vipulanantha College Vavuniya',
  'Puthukkulam Maha Vidiyalyam',
  'Vavuniya Nelukkulam Kalaimakal Maha Vidyalayam',
  'Cheddikulam Maha Vidyalayam',
];

const resultsStreams = ['Maths', 'Biology', 'Commerce'];
const resultsYears = ['2025', '2024'];
const idTypes = ['Index No', 'NIC No'];

const collapseVariants = {
  hidden: { height: 0, opacity: 0 },
  visible: { height: 'auto', opacity: 1 },
  exit: { height: 0, opacity: 0 },
};
const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

const onlyDigitsMax = (value: string, maxLen: number) => value.replace(/\D/g, '').slice(0, maxLen);

/*results sheet row */
const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="grid grid-cols-[180px_1fr] gap-4 items-center">
    <div className="text-slate-500">{label}</div>
    <div className="font-semibold text-slate-900 break-words">{value}</div>
  </div>
);

const ExamPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('apply');
  const [submitting, setSubmitting] = useState(false);

  const initialApplyForm = {
    fullName: '',
    email: '',
    phone: '',
    nic: '',
    exam: '',
    schoolName: '',
    gender: '' as 'male' | 'female' | '',
    agree: true,
  };
  const [applyForm, setApplyForm] = useState(initialApplyForm);

  const defaultResultsForm = { stream: '', idType: 'Index No', idValue: '', year: '' };
  const [resultsForm, setResultsForm] = useState(defaultResultsForm);

  const [resultData, setResultData] = useState<ResultRow | null>(null);
  const [showResultSheet, setShowResultSheet] = useState(false);

  const [paperFilter, setPaperFilter] = useState({ subject: '' });
  const [expandedYear, setExpandedYear] = useState<string | null>(null);

  const [downloading, setDownloading] = useState(false);
  const [examApplicationsOpen, setExamApplicationsOpen] = useState(true);
  const [examSettingLoading, setExamSettingLoading] = useState(true);
  const [resultsPublished, setResultsPublished] = useState(false);
  const [resultsSettingLoading, setResultsSettingLoading] = useState(true);

  const sheetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadSetting = async () => {
      setExamSettingLoading(true);
      setResultsSettingLoading(true);
      try {
        const { data, error } = await supabase
          .from('app_settings' as any)
          .select('*')
          .eq('id', 1)
          .maybeSingle();

        if (error) throw error;

        const settings = data as unknown as AppSettings | null;
        setExamApplicationsOpen(settings?.allow_exam_applications ?? false);
        setResultsPublished(settings?.allow_results_view ?? false);
      } catch (error) {
        console.error('Error loading exam application setting:', error);
        toast.error(language === 'en' ? 'Unable to load exam application status' : 'தேர்வு விண்ணப்ப நிலையை ஏற்ற முடியவில்லை');
        setExamApplicationsOpen(false);
        setResultsPublished(false);
      } finally {
        setExamSettingLoading(false);
        setResultsSettingLoading(false);
      }
    };

    loadSetting();
  }, [language]);

  // Fetch past papers from database
  const { data: pastPapers = [], isLoading: papersLoading } = useQuery({
    queryKey: ['past-papers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('past_papers').select('*').order('yrs', { ascending: false });
      if (error) throw error;
      return data as PastPaper[];
    },
  });

  const handleApplyReset = () => setApplyForm(initialApplyForm);

  // ✅ UPDATED (same logic as before style): use DB to fetch last index_no and generate next
  // Format: YY + 4 digits + StreamLetter
  // Auto range enforced: 0000–5555 only (manual/CSV 5556–9999 ignored)
  const generateNextIndexNo = async (year: number, stream: string) => {
    const streamLetter = (stream?.trim()?.[0] || 'X').toUpperCase();
    const yy = String(year).slice(-2);

    // Prefer the stream/year columns (safer than LIKE on index_no)
    // Pull a few latest rows and pick the first valid "AUTO" one (0000–5555).
    const { data, error } = await supabase
      .from('applicants' as any)
      .select('index_no')
      .eq('year', year)
      .eq('stream', stream)
      .order('index_no', { ascending: false })
      .limit(50);

    if (error) throw error;

    const rowsUnknown = data as unknown;
    const rows: Array<{ index_no?: string | null }> = Array.isArray(rowsUnknown) ? (rowsUnknown as any[]) : [];

    let lastSeq = -1; // next => 0000

    for (const r of rows) {
      const idx = typeof r?.index_no === 'string' ? r.index_no.trim() : '';

      // Expected: YY + 4 digits + Letter => length 7, e.g. 250000M
      if (idx.length === 7 && idx.startsWith(yy) && idx.endsWith(streamLetter)) {
        const digitsPart = idx.substring(2, 6); // the "exact two digit that fetch from databace" part => actually 4 digits
        const n = Number(digitsPart);

        // only AUTO range
        if (!Number.isNaN(n) && n >= 0 && n <= 5555) {
          lastSeq = n;
          break; // because ordered desc, first valid is the latest auto seq
        }
      }
    }

    const nextNum = lastSeq + 1;
    if (nextNum > 5555) {
      throw new Error('Index number limit reached (5555) for this year/stream.');
    }

    const fourDigits = String(nextNum).padStart(4, '0');
    return `${yy}${fourDigits}${streamLetter}`;
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !applyForm.fullName ||
      !applyForm.email ||
      !applyForm.phone ||
      !applyForm.nic ||
      !applyForm.schoolName ||
      !applyForm.exam ||
      !applyForm.gender
    ) {
      toast.error(language === 'en' ? 'Please fill all required fields' : 'தயவுசெய்து அனைத்து தேவையான புலங்களையும் நிரப்பவும்');
      return;
    }

    if (applyForm.phone.length !== 10) {
      toast.error(language === 'en' ? 'Phone number must be 10 digits' : 'தொலைபேசி எண் 10 இலக்கங்கள் இருக்க வேண்டும்');
      return;
    }

    if (!examApplicationsOpen) {
      toast.error(language === 'en' ? 'Applications are closed' : 'விண்ணப்பங்கள் மூடப்பட்டுள்ளது');
      return;
    }

    setSubmitting(true);
    try {
      const year = new Date().getFullYear();
      const indexNo = await generateNextIndexNo(year, applyForm.exam);

      const { error } = await supabase.from('applicants' as any).insert({
        index_no: indexNo,
        fullname: applyForm.fullName.trim(),
        gender: applyForm.gender === 'male', // true for male, false for female
        stream: applyForm.exam,
        nic: applyForm.nic.trim(),
        phone: applyForm.phone.trim(),
        email: applyForm.email.trim().toLowerCase(),
        school: applyForm.schoolName,
        year: year,
      });

      if (error) throw error;

      toast.success(
        `${language === 'en' ? 'Application submitted successfully! Your reference number is:' : 'விண்ணப்பம் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது! உங்கள் குறிப்பு எண்:'} ${indexNo}`
      );
      handleApplyReset();
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast.error(
        error?.message ||
          (language === 'en'
            ? 'Failed to submit application. Please try again.'
            : 'விண்ணப்பத்தை சமர்ப்பிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleResultsSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const key = `${resultsForm.stream}|${resultsForm.year}|${resultsForm.idType}|${resultsForm.idValue || ''}`;
    const found = (MOCK_RESULTS as Record<string, ResultRow>)[key];

    if (!found) {
      toast.error(language === 'en' ? 'No results found' : 'முடிவுகள் கிடைக்கவில்லை');
      setResultData(null);
      setShowResultSheet(false);
      return;
    }

    setResultData(found);
    setShowResultSheet(true);
  };

  const handleResultsReset = () => {
    setResultsForm(defaultResultsForm);
    setResultData(null);
    setShowResultSheet(false);
  };

  const availableYears = useMemo(
    () => Array.from(new Set(pastPapers.map((p) => String(p.yrs)))).sort((a, b) => Number(b) - Number(a)),
    [pastPapers]
  );

  const papersForYear = (year: string) =>
    pastPapers.filter((paper) => {
      if (String(paper.yrs) !== year) return false;
      if (paperFilter.subject && !paper.subject.toLowerCase().includes(paperFilter.subject.toLowerCase())) return false;
      return true;
    });

  const openDownload = (paper: PastPaper, type: 'paper' | 'scheme') => {
    const bucket = type === 'paper' ? paper.exam_paper_bucket : paper.scheme_bucket;
    const path = type === 'paper' ? paper.exam_paper_path : paper.scheme_path;

    if (!path) {
      toast.error(
        language === 'en'
          ? `${type === 'paper' ? 'Paper' : 'Scheme'} not available`
          : `${type === 'paper' ? 'வினாத்தாள்' : 'திட்டம்'} கிடைக்கவில்லை`
      );
      return;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    if (data?.publicUrl) {
      window.open(data.publicUrl, '_blank');
    } else {
      toast.error(language === 'en' ? 'Download link not available' : 'பதிவிறக்க இணைப்பு கிடைக்கவில்லை');
    }
  };

  // Certificate display (from resultData)
  const certName = resultData?.name ?? '-';
  const certSchool = resultData?.school ?? '-';
  const certNIC = resultData?.Nic_no ?? '-';
  const certRank = resultData?.rank ?? '-';

  // From search form
  const certStream = resultsForm.stream || '-';
  const certYear = resultsForm.year || '-';
  const certIndex = resultsForm.idType === 'Index No' ? resultsForm.idValue || '-' : '-';

  // Subject grades (from mock)
  const physicsGrade = resultData?.physics_grade ?? '-';
  const chemistryGrade = resultData?.Chemistry_grade ?? '-';
  const mathsGrade = resultData?.Maths_grade ?? '-';

  const downloadSheetAsImage = async () => {
    try {
      if (!sheetRef.current) {
        toast.error(language === 'en' ? 'Result sheet not found' : 'முடிவு தாள் கிடைக்கவில்லை');
        return;
      }

      setDownloading(true);

      const canvas = await html2canvas(sheetRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `GCE-AL-${certYear}-${certIndex}.png`;
      a.click();

      toast.success(language === 'en' ? 'Downloaded!' : 'பதிவிறக்கப்பட்டது!');
    } catch (e) {
      toast.error(language === 'en' ? 'Download failed (check html2canvas install)' : 'பதிவிறக்கம் தோல்வி (html2canvas நிறுவலை சரிபார்க்கவும்)');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <section className="py-16 md:py-24" style={{ backgroundImage: 'var(--gradient-hero)' }}>
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">{t('exam.title')}</h1>
            <p className="text-foreground/80 text-lg">
              {language === 'en'
                ? 'Register for exams, download past papers, and check your results'
                : 'தேர்வுகளுக்கு பதிவு செய்யுங்கள், கடந்த கால வினாத்தாள்களை பதிவிறக்கவும், உங்கள் முடிவுகளை சரிபார்க்கவும்'}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="apply" className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                <span className="hidden sm:inline">{t('exam.apply.title')}</span>
                <span className="sm:hidden">{language === 'en' ? 'Apply' : 'விண்ணப்பி'}</span>
              </TabsTrigger>

              <TabsTrigger value="papers" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">{t('exam.papers.title')}</span>
                <span className="sm:hidden">{language === 'en' ? 'Papers' : 'தாள்கள்'}</span>
              </TabsTrigger>

              <TabsTrigger value="results" className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                <span className="hidden sm:inline">{t('exam.results.title')}</span>
                <span className="sm:hidden">{language === 'en' ? 'Results' : 'முடிவுகள்'}</span>
              </TabsTrigger>
            </TabsList>

            {/* APPLY TAB */}
            <TabsContent value="apply">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-6 md:p-8 shadow-lg">
                <div className="mx-auto w-full max-w-md md:max-w-lg">
                  <div className="rounded-xl overflow-hidden border border-border">
                    <div className="bg-primary/90 text-primary-foreground px-5 py-4 text-center">
                      <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-wide">
                        {language === 'en' ? 'Apply for Your Exam' : 'உங்கள் தேர்விற்கு விண்ணப்பிக்கவும்'}
                      </h2>
                    </div>

                    <div className="p-5 md:p-6 bg-card">
                      {!examSettingLoading && !examApplicationsOpen ? (
                        <Card className="border-destructive/30 bg-destructive/5">
                          <CardContent className="p-6 space-y-2">
                            <h3 className="text-xl font-semibold text-destructive">
                              {language === 'en' ? 'Applications are closed' : 'விண்ணப்பங்கள் மூடப்பட்டுள்ளது'}
                            </h3>
                            <p className="text-muted-foreground">
                              {language === 'en'
                                ? 'Exam applications are currently closed. Please check back later.'
                                : 'தேர்வு விண்ணப்பங்கள் தற்போது மூடப்பட்டுள்ளது. தயவுசெய்து பின்னர் மீண்டும் பார்க்கவும்.'}
                            </p>
                          </CardContent>
                        </Card>
                      ) : (
                        <form onSubmit={handleApplySubmit} className="space-y-5">
                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">{language === 'en' ? 'Full Name' : 'முழு பெயர்'}</label>
                            <Input value={applyForm.fullName} onChange={(e) => setApplyForm({ ...applyForm, fullName: e.target.value })} required />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">{language === 'en' ? 'Email Address' : 'மின்னஞ்சல் முகவரி'}</label>
                            <Input type="email" value={applyForm.email} onChange={(e) => setApplyForm({ ...applyForm, email: e.target.value })} required />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">{language === 'en' ? 'Phone Number' : 'தொலைபேசி எண்'}</label>
                            <Input
                              inputMode="numeric"
                              value={applyForm.phone}
                              onChange={(e) => setApplyForm({ ...applyForm, phone: onlyDigitsMax(e.target.value, 10) })}
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">{language === 'en' ? 'NIC No' : 'தேசிய அடையாள எண்'}</label>
                            <Input value={applyForm.nic} onChange={(e) => setApplyForm({ ...applyForm, nic: e.target.value })} required />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">{language === 'en' ? 'Select Stream' : 'தேர்வைத் தேர்ந்தெடுக்கவும்'}</label>
                            <Select value={applyForm.exam} onValueChange={(v) => setApplyForm({ ...applyForm, exam: v })}>
                              <SelectTrigger>
                                <SelectValue placeholder={language === 'en' ? '-- Select Your Stream --' : '-- தேர்வு --'} />
                              </SelectTrigger>
                              <SelectContent>
                                {applyExams
                                  .filter((x) => x !== '-- Select Your Stream --')
                                  .map((exam) => (
                                    <SelectItem key={exam} value={exam}>
                                      {exam}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">{language === 'en' ? 'School Name' : 'பள்ளி பெயர்'}</label>
                            <Select value={applyForm.schoolName} onValueChange={(v) => setApplyForm({ ...applyForm, schoolName: v })}>
                              <SelectTrigger>
                                <SelectValue placeholder={language === 'en' ? 'Select school' : 'பள்ளியை தேர்வு செய்க'} />
                              </SelectTrigger>
                              <SelectContent>
                                {schoolOptions.map((s) => (
                                  <SelectItem key={s} value={s}>
                                    {s}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">{language === 'en' ? 'Gender' : 'பாலினம்'}</label>
                            <Select value={applyForm.gender} onValueChange={(v) => setApplyForm({ ...applyForm, gender: v as 'male' | 'female' })}>
                              <SelectTrigger>
                                <SelectValue placeholder={language === 'en' ? 'Select gender' : 'பாலினத்தைத் தேர்ந்தெடுக்கவும்'} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="male">{language === 'en' ? 'Male' : 'ஆண்'}</SelectItem>
                                <SelectItem value="female">{language === 'en' ? 'Female' : 'பெண்'}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Button type="button" variant="outline" className="w-full" onClick={handleApplyReset} disabled={examSettingLoading || submitting}>
                              {language === 'en' ? 'Reset' : 'மீட்டமை'}
                            </Button>
                            <Button type="submit" variant="donate" className="w-full" disabled={!examApplicationsOpen || examSettingLoading || submitting}>
                              {submitting ? (language === 'en' ? 'Submitting...' : 'சமர்ப்பிக்கிறது...') : language === 'en' ? 'Submit Application' : 'சமர்ப்பிக்கவும்'}
                            </Button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            {/* PAPERS TAB */}
            <TabsContent value="papers">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-6 md:p-8 shadow-lg">
                <h2 className="text-2xl font-serif font-bold text-foreground mb-2">{t('exam.papers.title')}</h2>
                <p className="text-muted-foreground mb-6">{t('exam.papers.subtitle')}</p>

                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex items-center gap-2 flex-1">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={language === 'en' ? 'Search subject...' : 'பாடத்தைத் தேடு...'}
                      value={paperFilter.subject}
                      onChange={(e) => {
                        setPaperFilter({ subject: e.target.value });
                        setExpandedYear(null);
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {papersLoading ? (
                    <div className="text-center py-8">
                      <div className="text-muted-foreground">{language === 'en' ? 'Loading past papers...' : 'கடந்த கால வினாத்தாள்களை ஏற்றுகிறது...'}</div>
                    </div>
                  ) : availableYears.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-muted-foreground">{language === 'en' ? 'No past papers available' : 'கடந்த கால வினாத்தாள்கள் கிடைக்கவில்லை'}</div>
                    </div>
                  ) : (
                    availableYears.map((year) => {
                      const yearPapers = papersForYear(year);
                      const isOpen = expandedYear === year;

                      return (
                        <div key={year} className="bg-muted rounded-lg p-4">
                          <button type="button" onClick={() => setExpandedYear(isOpen ? null : year)} className="w-full flex items-center justify-between">
                            <div className="text-left">
                              <p className="font-semibold text-foreground">{year}</p>
                              <p className="text-sm text-muted-foreground">
                                {yearPapers.length}{' '}
                                {yearPapers.length === 1 ? (language === 'en' ? 'paper' : 'வினாத்தாள்') : language === 'en' ? 'papers' : 'வினாத்தாள்கள்'}
                              </p>
                            </div>
                            <span className="text-sm text-muted-foreground">{isOpen ? (language === 'en' ? 'Hide' : 'மூடு') : language === 'en' ? 'View' : 'காண'}</span>
                          </button>

                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                key={`panel-${year}`}
                                variants={collapseVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                transition={{ duration: 0.25, ease: 'easeInOut' }}
                                className="overflow-hidden"
                              >
                                <div className="mt-4 space-y-3">
                                  {yearPapers.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-6">{t('common.noResults')}</p>
                                  ) : (
                                    yearPapers.map((paper) => (
                                      <motion.div
                                        key={paper.pp_id}
                                        variants={itemVariants}
                                        initial="hidden"
                                        animate="visible"
                                        transition={{ duration: 0.2 }}
                                        className="flex items-center justify-between p-4 bg-card rounded-lg hover:bg-card/80 transition-colors"
                                      >
                                        <div className="flex items-center gap-3">
                                          <FileText className="w-5 h-5 text-secondary" />
                                          <div>
                                            <p className="font-medium text-foreground">{paper.subject}</p>
                                            <p className="text-sm text-muted-foreground">{paper.yrs}</p>
                                          </div>
                                        </div>

                                        <div className="flex w-full sm:w-auto gap-2 sm:justify-end">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 sm:flex-none"
                                            onClick={() => openDownload(paper, 'paper')}
                                            disabled={!paper.exam_paper_path}
                                          >
                                            <Download className="w-4 h-4 mr-1" />
                                            {language === 'en' ? 'Paper' : 'வினாத்தாள்'}
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 sm:flex-none"
                                            onClick={() => openDownload(paper, 'scheme')}
                                            disabled={!paper.scheme_path}
                                          >
                                            <Download className="w-4 h-4 mr-1" />
                                            {language === 'en' ? 'Scheme' : 'திட்டம்'}
                                          </Button>
                                        </div>
                                      </motion.div>
                                    ))
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            </TabsContent>

            {/* RESULTS TAB */}
            <TabsContent value="results">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-6 md:p-8 shadow-lg">
                <div className="min-h-[40vh] flex items-center justify-center">
                  <div className="w-full max-w-3xl">
                    {!resultsSettingLoading && !resultsPublished ? (
                      <Card className="border-destructive/30 bg-destructive/5">
                        <CardContent className="p-6 space-y-2">
                          <h3 className="text-xl font-semibold text-destructive">{language === 'en' ? 'Results not published yet' : 'முடிவுகள் இன்னும் வெளியிடப்படவில்லை'}</h3>
                          <p className="text-muted-foreground">
                            {language === 'en'
                              ? 'Examination results are not yet available. Please check back later.'
                              : 'தேர்வு முடிவுகள் இன்னும் கிடைக்கவில்லை. தயவுசெய்து பின்னர் மீண்டும் பார்க்கவும்.'}
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <AnimatePresence mode="wait">
                        {!showResultSheet ? (
                          <motion.div key="results-form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
                            <h2 className="text-2xl font-bold text-foreground mb-2">{language === 'en' ? 'View Results' : 'முடிவுகளை காண'}</h2>
                            <p className="text-muted-foreground mb-6">{language === 'en' ? 'Check your examination results' : 'உங்கள் தேர்வு முடிவுகளை சரிபார்க்கவும்'}</p>

                            <form onSubmit={handleResultsSubmit} className="space-y-4 max-w-lg">
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-1">{language === 'en' ? 'Select Stream' : 'பிரிவைத் தேர்ந்தெடுக்கவும்'}</label>
                                <Select value={resultsForm.stream} onValueChange={(v) => setResultsForm({ ...resultsForm, stream: v })}>
                                  <SelectTrigger>
                                    <SelectValue placeholder={language === 'en' ? 'Choose stream' : 'பிரிவை தேர்வு செய்க'} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {resultsStreams.map((s) => (
                                      <SelectItem key={s} value={s}>
                                        {s}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-foreground mb-1">{language === 'en' ? 'Select Index / NIC' : 'Index / NIC தேர்ந்தெடுக்கவும்'}</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <Select value={resultsForm.idType} onValueChange={(v) => setResultsForm({ ...resultsForm, idType: v })}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {idTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                          {type}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Input
                                    value={resultsForm.idValue}
                                    onChange={(e) => setResultsForm({ ...resultsForm, idValue: e.target.value })}
                                    placeholder={language === 'en' ? 'Enter value' : 'உள்ளிடவும்'}
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-foreground mb-1">{language === 'en' ? 'Select Year' : 'ஆண்டைத் தேர்ந்தெடுக்கவும்'}</label>
                                <Select value={resultsForm.year} onValueChange={(v) => setResultsForm({ ...resultsForm, year: v })}>
                                  <SelectTrigger>
                                    <SelectValue placeholder={language === 'en' ? 'Choose year' : 'ஆண்டை தேர்வு செய்க'} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {resultsYears.map((y) => (
                                      <SelectItem key={y} value={y}>
                                        {y}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="grid grid-cols-2 gap-3 pt-2">
                                <Button type="button" variant="outline" className="w-full" onClick={handleResultsReset}>
                                  {language === 'en' ? 'Reset' : 'மீட்டமை'}
                                </Button>
                                <Button type="submit" variant="donate" className="w-full">
                                  {language === 'en' ? 'View Results' : 'முடிவுகளை காண'}
                                </Button>
                              </div>
                            </form>
                          </motion.div>
                        ) : (
                          <motion.div key="results-sheet" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.25 }}>
                            <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-sky-50 via-white to-sky-100 shadow-xl">
                              <div className="pointer-events-none absolute inset-0 opacity-40">
                                <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-sky-200 blur-3xl" />
                                <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-sky-200 blur-3xl" />
                              </div>

                              <div className="relative px-6 py-10 md:px-10">
                                <div ref={sheetRef} className="mx-auto w-full max-w-3xl">
                                  <div className="flex flex-col items-center text-center">
                                    <div className="h-16 w-16 rounded-full bg-white shadow-sm ring-1 ring-black/5 flex items-center justify-center overflow-hidden">
                                      <img
                                        src={emblemImg}
                                        alt="Emblem"
                                        className="h-full w-full object-cover"
                                        onError={(e) => (e.currentTarget.style.display = 'none')}
                                      />
                                    </div>

                                    <div className="mt-4 flex items-center gap-3 w-full max-w-2xl">
                                      <div className="h-px flex-1 bg-amber-200" />
                                      <div className="h-2 w-2 rounded-full bg-amber-300" />
                                      <div className="h-px flex-1 bg-amber-200" />
                                    </div>

                                    <h3 className="mt-5 text-2xl md:text-3xl font-bold tracking-wide text-slate-900">G.C.E. (A/L) EXAMINATION - {certYear}</h3>
                                  </div>

                                  <div className="mt-8 rounded-2xl bg-white/90 backdrop-blur border border-amber-200 shadow-sm">
                                    <div className="p-8">
                                      <div className="grid grid-cols-1 gap-5 text-base">
                                        <Row label="Name" value={certName} />
                                        <Row label="Index Number" value={certIndex} />
                                        <Row label="NIC Number" value={certNIC} />
                                        <Row label="School" value={certSchool} />
                                        <Row label="Stream" value={certStream} />
                                        <Row label="Rank" value={certRank} />
                                      </div>

                                      <div className="mt-10 overflow-hidden rounded-xl border border-slate-700">
                                        <div className="grid grid-cols-2 bg-slate-700 text-white font-semibold">
                                          <div className="px-6 py-4 text-left">Subject</div>
                                          <div className="px-6 py-4 text-center">Result</div>
                                        </div>

                                        <div className="bg-white">
                                          {[
                                            { subject: 'COMBINED MATHEMATICS', result: mathsGrade },
                                            { subject: 'PHYSICS', result: physicsGrade },
                                            { subject: 'CHEMISTRY', result: chemistryGrade },
                                          ].map((r) => (
                                            <div key={r.subject} className="grid grid-cols-2 border-t border-slate-200">
                                              <div className="px-6 py-6 text-slate-700 font-semibold">{r.subject}</div>
                                              <div className="px-6 py-6 text-center font-extrabold text-amber-700 text-xl">{r.result}</div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      <p className="mt-12 text-center text-sm text-slate-500">This result is provisional and subject to official confirmation.</p>
                                      <p className="mt-3 text-center text-sm text-slate-500">Copyright © Ausdav, Vavuniya. All Rights Reserved.</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                                  <Button onClick={downloadSheetAsImage} disabled={downloading} className="bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60">
                                    <ImageDown className="w-4 h-4 mr-2" />
                                    {downloading ? (language === 'en' ? 'Downloading...' : 'பதிவிறக்கம்...') : language === 'en' ? 'Download' : 'பதிவிறக்கு'}
                                  </Button>

                                  <Button onClick={handleResultsReset} className="bg-amber-600 text-white hover:bg-amber-500">
                                    {language === 'en' ? 'Back' : 'மீண்டும்'}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </div>
                </div>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
};

export default ExamPage;