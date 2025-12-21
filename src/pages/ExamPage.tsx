import React, { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FileText, Download, Search, ClipboardList, Award, ImageDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import emblemImg from '@/assets/Exam/AUSDAV logo.png';


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
  id: number;
  year: string;
  subject: string;
  stream: string;
  paperUrl: string;
  schemeUrl: string;
};

const pastPapers: PastPaper[] = [
  { id: 1, year: '2025', subject: 'Combined Mathematics', stream: 'Science', paperUrl: '#', schemeUrl: '#' },
  { id: 2, year: '2025', subject: 'Biology', stream: 'Science', paperUrl: '#', schemeUrl: '#' },
  { id: 3, year: '2025', subject: 'Physics', stream: 'Science', paperUrl: '#', schemeUrl: '#' },
  { id: 4, year: '2025', subject: 'Chemistry', stream: 'Science', paperUrl: '#', schemeUrl: '#' },
  { id: 5, year: '2024', subject: 'Combined Mathematics', stream: 'Science', paperUrl: '#', schemeUrl: '#' },
  { id: 6, year: '2024', subject: 'Biology', stream: 'Science', paperUrl: '#', schemeUrl: '#' },
  { id: 7, year: '2024', subject: 'Physics', stream: 'Science', paperUrl: '#', schemeUrl: '#' },
  { id: 8, year: '2024', subject: 'Chemistry', stream: 'Science', paperUrl: '#', schemeUrl: '#' },
  { id: 9, year: '2023', subject: 'Combined Mathematics', stream: 'Science', paperUrl: '#', schemeUrl: '#' },
  { id: 10, year: '2023', subject: 'Biology', stream: 'Science', paperUrl: '#', schemeUrl: '#' },
  { id: 11, year: '2023', subject: 'Physics', stream: 'Science', paperUrl: '#', schemeUrl: '#' },
  { id: 12, year: '2023', subject: 'Chemistry', stream: 'Science', paperUrl: '#', schemeUrl: '#' },
  { id: 13, year: '2022', subject: 'Combined Mathematics', stream: 'Science', paperUrl: '#', schemeUrl: '#' },
  { id: 14, year: '2022', subject: 'Biology', stream: 'Science', paperUrl: '#', schemeUrl: '#' },
  { id: 15, year: '2022', subject: 'Physics', stream: 'Science', paperUrl: '#', schemeUrl: '#' },
  { id: 16, year: '2022', subject: 'Chemistry', stream: 'Science', paperUrl: '#', schemeUrl: '#' },
  { id: 17, year: '2021', subject: 'Combined Mathematics', stream: 'Science', paperUrl: '#', schemeUrl: '#' },
  { id: 18, year: '2021', subject: 'Biology', stream: 'Science', paperUrl: '#', schemeUrl: '#' },
  { id: 19, year: '2021', subject: 'Physics', stream: 'Science', paperUrl: '#', schemeUrl: '#' },
  { id: 20, year: '2021', subject: 'Chemistry', stream: 'Science', paperUrl: '#', schemeUrl: '#' },
];

// Apply form options
const applyExams = ['-- Select Your Stream --', 'Maths', 'Biology'];
const schoolOptions = ['Vavniya Tamil Madhya Maha Vidyalayam',"V/Rambaikulam girls' maha vidyalayam",'Saivapragasa Ladies College','Vipulanantha College Vavuniya',
  'Puthukkulam Maha Vidiyalyam','Vavuniya Nelukkulam Kalaimakal Maha Vidyalayam','Cheddikulam Maha Vidyalayam'];

const resultsStreams = ['Maths', 'Biology', 'Commerce'];
const resultsYears = ['2025', '2024'];
const idTypes = ['Index No', 'NIC No'];

const collapseVariants = { hidden: { height: 0, opacity: 0 }, visible: { height: 'auto', opacity: 1 }, exit: { height: 0, opacity: 0 } };
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

  const initialApplyForm = {
    fullName: '',
    email: '',
    phone: '',
    nic: '',
    exam: '',
    schoolName: '',
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

  // ✅ Now we capture the WHOLE sheet (including header)
  const sheetRef = useRef<HTMLDivElement | null>(null);

  const handleApplyReset = () => setApplyForm(initialApplyForm);

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!applyForm.fullName || !applyForm.email || !applyForm.phone || !applyForm.nic || !applyForm.schoolName || !applyForm.exam) {
      toast.error(language === 'en' ? 'Please fill all required fields' : 'தயவுசெய்து அனைத்து தேவையான புலங்களையும் நிரப்பவும்');
      return;
    }

    if (applyForm.phone.length !== 10) {
      toast.error(language === 'en' ? 'Phone number must be 10 digits' : 'தொலைபேசி எண் 10 இலக்கங்கள் இருக்க வேண்டும்');
      return;
    }

    const refNumber = `AUSDAV-${Date.now().toString(36).toUpperCase()}`;
    toast.success(`${language === 'en' ? 'Application submitted. Reference:' : 'விண்ணப்பம் சமர்ப்பிக்கப்பட்டது. குறிப்பு:'} ${refNumber}`);
    handleApplyReset();
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
    () => Array.from(new Set(pastPapers.map((p) => String(p.year)))).sort((a, b) => Number(b) - Number(a)),
    []
  );

  const papersForYear = (year: string) =>
    pastPapers.filter((paper) => {
      if (paper.year !== year) return false;
      if (paperFilter.subject && !paper.subject.toLowerCase().includes(paperFilter.subject.toLowerCase())) return false;
      return true;
    });

  const openDownload = (url: string) => {
    if (!url || url === '#') return toast.error(language === 'en' ? 'Download link not available' : 'பதிவிறக்க இணைப்பு கிடைக்கவில்லை');
    window.open(url, '_blank');
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
                          <Input inputMode="numeric" value={applyForm.phone} onChange={(e) => setApplyForm({ ...applyForm, phone: onlyDigitsMax(e.target.value, 10) })} required />
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

                        <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Button type="button" variant="outline" className="w-full" onClick={handleApplyReset}>
                            {language === 'en' ? 'Reset' : 'மீட்டமை'}
                          </Button>
                          <Button type="submit" variant="donate" className="w-full">
                            {language === 'en' ? 'Submit Application' : 'சமர்ப்பிக்கவும்'}
                          </Button>
                        </div>
                      </form>
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
                    <Input placeholder={language === 'en' ? 'Search subject...' : 'பாடத்தைத் தேடு...'} value={paperFilter.subject} onChange={(e) => { setPaperFilter({ subject: e.target.value }); setExpandedYear(null); }} />
                  </div>
                </div>

                <div className="space-y-4">
                  {availableYears.map((year) => {
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
                            <motion.div key={`panel-${year}`} variants={collapseVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.25, ease: 'easeInOut' }} className="overflow-hidden">
                              <div className="mt-4 space-y-3">
                                {yearPapers.length === 0 ? (
                                  <p className="text-center text-muted-foreground py-6">{t('common.noResults')}</p>
                                ) : (
                                  yearPapers.map((paper) => (
                                    <motion.div key={paper.id} variants={itemVariants} initial="hidden" animate="visible" transition={{ duration: 0.2 }} className="flex items-center justify-between p-4 bg-card rounded-lg hover:bg-card/80 transition-colors">
                                      <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-secondary" />
                                        <div>
                                          <p className="font-medium text-foreground">{paper.subject}</p>
                                          <p className="text-sm text-muted-foreground">{paper.year}</p>
                                        </div>
                                      </div>

                                      <div className="flex w-full sm:w-auto gap-2 sm:justify-end">
                                        <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => openDownload(paper.paperUrl)}>
                                          <Download className="w-4 h-4 mr-1" />
                                          {language === 'en' ? 'Paper' : 'வினாத்தாள்'}
                                        </Button>
                                        <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => openDownload(paper.schemeUrl)}>
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
                  })}
                </div>
              </motion.div>
            </TabsContent>

            {/* RESULTS TAB */}
            <TabsContent value="results">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-6 md:p-8 shadow-lg">
                <div className="min-h-[40vh] flex items-center justify-center">
                  <div className="w-full max-w-3xl">
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
                                <Input value={resultsForm.idValue} onChange={(e) => setResultsForm({ ...resultsForm, idValue: e.target.value })} placeholder={language === 'en' ? 'Enter value' : 'உள்ளிடவும்'} />
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
                                    <img src={emblemImg} alt="Emblem" className="h-full w-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />

                                  </div>

                                  <div className="mt-4 flex items-center gap-3 w-full max-w-2xl">
                                    <div className="h-px flex-1 bg-amber-200" />
                                    <div className="h-2 w-2 rounded-full bg-amber-300" />
                                    <div className="h-px flex-1 bg-amber-200" />
                                  </div>

                                  <h3 className="mt-5 text-2xl md:text-3xl font-bold tracking-wide text-slate-900">
                                    G.C.E. (A/L) EXAMINATION - {certYear}
                                  </h3>
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

                                    <p className="mt-12 text-center text-sm text-slate-500">
                                      This result is provisional and subject to official confirmation.
                                    </p>
                                    <p className="mt-3 text-center text-sm text-slate-500">
                                      Copyright © Ausdav, Vavuniya. All Rights Reserved.
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                                <Button
                                  onClick={downloadSheetAsImage}
                                  disabled={downloading}
                                  className="bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
                                >
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
