import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Download, MapPin, Users, FileText } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Seminar = {
  sem_id: number;
  yrs: number;
  seminar_paper_bucket: string;
  seminar_paper_path: string | null;
  answers_bucket: string;
  answers_path: string | null;
  created_at: string;
  updated_at: string;
};

const SeminarPage: React.FC = () => {
  const { t, language } = useLanguage();

  // Fetch seminars from database
  const { data: seminars = [], isLoading: seminarsLoading } = useQuery({
    queryKey: ['seminars'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seminars')
        .select('*')
        .order('yrs', { ascending: false });

      if (error) throw error;
      return data as Seminar[];
    },
  });

  const openDownload = (seminar: Seminar, type: 'paper' | 'answers') => {
    const bucket = type === 'paper' ? seminar.seminar_paper_bucket : seminar.answers_bucket;
    const path = type === 'paper' ? seminar.seminar_paper_path : seminar.answers_path;

    if (!path) {
      const typeLabel = type === 'paper' ? (language === 'en' ? 'Paper' : 'தாள்') : (language === 'en' ? 'Answers' : 'பதில்கள்');
      toast.error(language === 'en' ? `${typeLabel} not available` : `${typeLabel} கிடைக்கவில்லை`);
      return;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    if (data?.publicUrl) {
      window.open(data.publicUrl, '_blank');
    } else {
      toast.error(language === 'en' ? 'Download link not available' : 'பதிவிறக்க இணைப்பு கிடைக்கவில்லை');
    }
  };

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
              {t('seminar.title')}
            </h1>
            <p className="text-foreground/80 text-lg">
              {language === 'en'
                ? 'Download seminar papers and answers to enhance your learning'
                : 'உங்கள் கல்வியை மேம்படுத்துவதற்கு செமினார் தாள்களை மற்றும் பதில்களை பதிவிறக்கவும்'}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Seminar Papers and Answers */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-serif font-bold text-foreground mb-8"
          >
            {language === 'en' ? 'Seminar Resources' : 'செமினார் வளங்கள்'}
          </motion.h2>

          <div className="max-w-4xl mx-auto">
            {seminarsLoading ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">{language === 'en' ? 'Loading seminars...' : 'செமினார்களை ஏற்றுகிறது...'}</div>
              </div>
            ) : seminars.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">{language === 'en' ? 'No seminars available' : 'செமினார்கள் கிடைக்கவில்லை'}</div>
              </div>
            ) : (
              <div className="space-y-4">
                {seminars.map((seminar) => (
                  <motion.div
                    key={seminar.sem_id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex items-center justify-between p-6 bg-card rounded-xl shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <FileText className="w-8 h-8 text-secondary" />
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">
                          {language === 'en' ? `Seminar ${seminar.yrs}` : `${seminar.yrs} செமினார்`}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(seminar.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'ta-LK', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDownload(seminar, 'paper')}
                        disabled={!seminar.seminar_paper_path}
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        {language === 'en' ? 'Paper' : 'தாள்'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDownload(seminar, 'answers')}
                        disabled={!seminar.answers_path}
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        {language === 'en' ? 'Answers' : 'பதில்கள்'}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default SeminarPage;
