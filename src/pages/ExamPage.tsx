import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Search, ClipboardList, Award, Filter } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

// Sample past papers
const pastPapers = [
  { id: 1, year: '2024', subject: 'Physics', stream: 'Science', downloadUrl: '#' },
  { id: 2, year: '2024', subject: 'Chemistry', stream: 'Science', downloadUrl: '#' },
  { id: 3, year: '2024', subject: 'Biology', stream: 'Science', downloadUrl: '#' },
  { id: 4, year: '2023', subject: 'Physics', stream: 'Science', downloadUrl: '#' },
  { id: 5, year: '2023', subject: 'Combined Maths', stream: 'Maths', downloadUrl: '#' },
  { id: 6, year: '2024', subject: 'Accounting', stream: 'Commerce', downloadUrl: '#' },
];

// Sample exam sessions
const examSessions = [
  { id: 1, name: 'January 2025 Batch', year: '2025' },
  { id: 2, name: 'August 2025 Batch', year: '2025' },
];

const streams = ['Science', 'Maths', 'Commerce', 'Arts', 'Technology'];
const districts = ['Vavuniya', 'Jaffna', 'Kilinochchi', 'Mullaitivu', 'Mannar', 'Batticaloa', 'Trincomalee'];

const ExamPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('apply');
  
  // Apply form state
  const [applyForm, setApplyForm] = useState({
    fullName: '',
    nic: '',
    phone: '',
    school: '',
    district: '',
    stream: '',
    subject: '',
    session: '',
    email: '',
  });

  // Results lookup state
  const [resultsForm, setResultsForm] = useState({
    referenceNumber: '',
    phone: '',
  });
  const [resultData, setResultData] = useState<null | { marks: number; grade: string; rank: number }>(null);

  // Filter state
  const [paperFilter, setPaperFilter] = useState({ year: 'all', subject: '' });

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyForm.fullName || !applyForm.phone || !applyForm.school || !applyForm.district || !applyForm.stream || !applyForm.session) {
      toast.error(language === 'en' ? 'Please fill all required fields' : 'தயவுசெய்து அனைத்து தேவையான புலங்களையும் நிரப்பவும்');
      return;
    }
    const refNumber = `AUSDAV-${Date.now().toString(36).toUpperCase()}`;
    toast.success(`${t('exam.form.success')} ${refNumber}`);
    setApplyForm({
      fullName: '',
      nic: '',
      phone: '',
      school: '',
      district: '',
      stream: '',
      subject: '',
      session: '',
      email: '',
    });
  };

  const handleResultsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resultsForm.referenceNumber || !resultsForm.phone) {
      toast.error(language === 'en' ? 'Please enter reference number and phone' : 'தயவுசெய்து குறிப்பு எண் மற்றும் தொலைபேசியை உள்ளிடவும்');
      return;
    }
    // Simulate result lookup
    setResultData({ marks: 78, grade: 'B', rank: 45 });
  };

  const filteredPapers = pastPapers.filter((paper) => {
    if (paperFilter.year !== 'all' && paper.year !== paperFilter.year) return false;
    if (paperFilter.subject && !paper.subject.toLowerCase().includes(paperFilter.subject.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      {/* Hero */}
      <section
        className="py-16 md:py-24"
        style={{ backgroundImage: 'var(--gradient-hero)' }}
      >
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
              {t('exam.title')}
            </h1>
            <p className="text-foreground/80 text-lg">
              {language === 'en'
                ? 'Register for exams, download past papers, and check your results'
                : 'தேர்வுகளுக்கு பதிவு செய்யுங்கள், கடந்த கால வினாத்தாள்களை பதிவிறக்கவும், உங்கள் முடிவுகளை சரிபார்க்கவும்'}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Tabs Section */}
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

            {/* Apply Tab */}
            <TabsContent value="apply">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl p-6 md:p-8 shadow-lg"
              >
                <h2 className="text-2xl font-serif font-bold text-foreground mb-2">
                  {t('exam.apply.title')}
                </h2>
                <p className="text-muted-foreground mb-6">{t('exam.apply.subtitle')}</p>

                <form onSubmit={handleApplySubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        {t('exam.form.name')} *
                      </label>
                      <Input
                        value={applyForm.fullName}
                        onChange={(e) => setApplyForm({ ...applyForm, fullName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        {t('exam.form.nic')}
                      </label>
                      <Input
                        value={applyForm.nic}
                        onChange={(e) => setApplyForm({ ...applyForm, nic: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        {t('exam.form.phone')} *
                      </label>
                      <Input
                        value={applyForm.phone}
                        onChange={(e) => setApplyForm({ ...applyForm, phone: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        {t('exam.form.email')}
                      </label>
                      <Input
                        type="email"
                        value={applyForm.email}
                        onChange={(e) => setApplyForm({ ...applyForm, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        {t('exam.form.school')} *
                      </label>
                      <Input
                        value={applyForm.school}
                        onChange={(e) => setApplyForm({ ...applyForm, school: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        {t('exam.form.district')} *
                      </label>
                      <Select
                        value={applyForm.district}
                        onValueChange={(v) => setApplyForm({ ...applyForm, district: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={language === 'en' ? 'Select district' : 'மாவட்டத்தைத் தேர்ந்தெடுக்கவும்'} />
                        </SelectTrigger>
                        <SelectContent>
                          {districts.map((d) => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        {t('exam.form.stream')} *
                      </label>
                      <Select
                        value={applyForm.stream}
                        onValueChange={(v) => setApplyForm({ ...applyForm, stream: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={language === 'en' ? 'Select stream' : 'பிரிவைத் தேர்ந்தெடுக்கவும்'} />
                        </SelectTrigger>
                        <SelectContent>
                          {streams.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        {t('exam.form.session')} *
                      </label>
                      <Select
                        value={applyForm.session}
                        onValueChange={(v) => setApplyForm({ ...applyForm, session: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={language === 'en' ? 'Select session' : 'அமர்வைத் தேர்ந்தெடுக்கவும்'} />
                        </SelectTrigger>
                        <SelectContent>
                          {examSessions.map((s) => (
                            <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button type="submit" variant="donate" className="w-full mt-4">
                    {t('exam.form.submit')}
                  </Button>
                </form>
              </motion.div>
            </TabsContent>

            {/* Past Papers Tab */}
            <TabsContent value="papers">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl p-6 md:p-8 shadow-lg"
              >
                <h2 className="text-2xl font-serif font-bold text-foreground mb-2">
                  {t('exam.papers.title')}
                </h2>
                <p className="text-muted-foreground mb-6">{t('exam.papers.subtitle')}</p>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex items-center gap-2 flex-1">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={language === 'en' ? 'Search subject...' : 'பாடத்தைத் தேடு...'}
                      value={paperFilter.subject}
                      onChange={(e) => setPaperFilter({ ...paperFilter, subject: e.target.value })}
                    />
                  </div>
                  <Select
                    value={paperFilter.year}
                    onValueChange={(v) => setPaperFilter({ ...paperFilter, year: v })}
                  >
                    <SelectTrigger className="w-full sm:w-40">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder={language === 'en' ? 'Year' : 'ஆண்டு'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{language === 'en' ? 'All Years' : 'அனைத்து ஆண்டுகளும்'}</SelectItem>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2023">2023</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Papers List */}
                <div className="space-y-3">
                  {filteredPapers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">{t('common.noResults')}</p>
                  ) : (
                    filteredPapers.map((paper) => (
                      <div
                        key={paper.id}
                        className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-secondary" />
                          <div>
                            <p className="font-medium text-foreground">{paper.subject}</p>
                            <p className="text-sm text-muted-foreground">
                              {paper.year} • {paper.stream}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-1" />
                          {t('common.download')}
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </TabsContent>

            {/* Results Tab */}
            <TabsContent value="results">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl p-6 md:p-8 shadow-lg"
              >
                <h2 className="text-2xl font-serif font-bold text-foreground mb-2">
                  {t('exam.results.title')}
                </h2>
                <p className="text-muted-foreground mb-6">{t('exam.results.subtitle')}</p>

                <form onSubmit={handleResultsSubmit} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      {language === 'en' ? 'Reference Number' : 'குறிப்பு எண்'} *
                    </label>
                    <Input
                      value={resultsForm.referenceNumber}
                      onChange={(e) => setResultsForm({ ...resultsForm, referenceNumber: e.target.value })}
                      placeholder="AUSDAV-XXXXXX"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      {t('exam.form.phone')} *
                    </label>
                    <Input
                      value={resultsForm.phone}
                      onChange={(e) => setResultsForm({ ...resultsForm, phone: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" variant="donate">
                    {t('exam.results.title')}
                  </Button>
                </form>

                {/* Result Display */}
                {resultData && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-8 p-6 bg-muted rounded-xl"
                  >
                    <h3 className="font-serif font-semibold text-lg text-foreground mb-4">
                      {language === 'en' ? 'Your Results' : 'உங்கள் முடிவுகள்'}
                    </h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-card rounded-lg p-4">
                        <p className="text-3xl font-bold text-secondary">{resultData.marks}</p>
                        <p className="text-sm text-muted-foreground">{language === 'en' ? 'Marks' : 'மதிப்பெண்கள்'}</p>
                      </div>
                      <div className="bg-card rounded-lg p-4">
                        <p className="text-3xl font-bold text-secondary">{resultData.grade}</p>
                        <p className="text-sm text-muted-foreground">{language === 'en' ? 'Grade' : 'தரம்'}</p>
                      </div>
                      <div className="bg-card rounded-lg p-4">
                        <p className="text-3xl font-bold text-secondary">#{resultData.rank}</p>
                        <p className="text-sm text-muted-foreground">{language === 'en' ? 'Rank' : 'தரவரிசை'}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
};

export default ExamPage;
