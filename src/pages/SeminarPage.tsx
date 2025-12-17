import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Download, MapPin, Users } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

// Sample seminars
const seminars = [
  {
    id: 1,
    titleEN: 'A/L Exam Preparation Masterclass 2025',
    titleTA: 'உ.த. தேர்வு தயாரிப்பு மாஸ்டர்கிளாஸ் 2025',
    descriptionEN: 'Comprehensive preparation program covering all major subjects with expert guidance and proven strategies.',
    descriptionTA: 'நிபுணர் வழிகாட்டுதல் மற்றும் நிரூபிக்கப்பட்ட உத்திகளுடன் அனைத்து முக்கிய பாடங்களையும் உள்ளடக்கிய விரிவான தயாரிப்பு திட்டம்.',
    date: '2025-01-15',
    location: 'Vavuniya University',
    speakers: 12,
    isUpcoming: true,
    bookletUrl: null,
  },
  {
    id: 2,
    titleEN: 'Career Guidance Workshop',
    titleTA: 'தொழில் வழிகாட்டுதல் பட்டறை',
    descriptionEN: 'Explore career opportunities and learn about university admissions, scholarships, and professional pathways.',
    descriptionTA: 'தொழில் வாய்ப்புகளை ஆராயுங்கள் மற்றும் பல்கலைக்கழக சேர்க்கைகள், உதவித்தொகைகள் மற்றும் தொழில்முறை வழிகள் பற்றி அறியுங்கள்.',
    date: '2025-03-20',
    location: 'Community Hall, Vavuniya',
    speakers: 8,
    isUpcoming: true,
    bookletUrl: null,
  },
  {
    id: 3,
    titleEN: 'Physics Problem Solving Workshop 2024',
    titleTA: 'இயற்பியல் சிக்கல் தீர்க்கும் பட்டறை 2024',
    descriptionEN: 'Intensive workshop focused on solving complex physics problems with step-by-step methodologies.',
    descriptionTA: 'படிப்படியான முறைகளுடன் சிக்கலான இயற்பியல் சிக்கல்களை தீர்ப்பதில் கவனம் செலுத்தும் தீவிர பட்டறை.',
    date: '2024-08-15',
    location: 'Vavuniya Central College',
    speakers: 5,
    isUpcoming: false,
    bookletUrl: '#',
  },
  {
    id: 4,
    titleEN: 'Chemistry Lab Techniques Seminar 2024',
    titleTA: 'வேதியியல் ஆய்வக நுட்பங்கள் கருத்தரங்கு 2024',
    descriptionEN: 'Hands-on training in essential chemistry laboratory techniques and practical exam preparation.',
    descriptionTA: 'அத்தியாவசிய வேதியியல் ஆய்வக நுட்பங்கள் மற்றும் நடைமுறை தேர்வு தயாரிப்பில் நடைமுறை பயிற்சி.',
    date: '2024-07-10',
    location: 'Science Lab, Vavuniya',
    speakers: 4,
    isUpcoming: false,
    bookletUrl: '#',
  },
];

const SeminarPage: React.FC = () => {
  const { t, language } = useLanguage();

  const upcomingSeminars = seminars.filter((s) => s.isUpcoming);
  const pastSeminars = seminars.filter((s) => !s.isUpcoming);

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
                ? 'Join our educational seminars and workshops designed to help you succeed'
                : 'உங்கள் வெற்றிக்கு உதவ வடிவமைக்கப்பட்ட எங்கள் கல்வி கருத்தரங்குகள் மற்றும் பட்டறைகளில் சேரவும்'}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Upcoming Seminars */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-serif font-bold text-foreground mb-8"
          >
            {t('seminar.upcoming')}
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-6">
            {upcomingSeminars.map((seminar, idx) => (
              <motion.div
                key={seminar.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="h-2 bg-gradient-to-r from-secondary to-secondary/60" />
                <div className="p-6">
                  <div className="flex items-center gap-2 text-secondary text-sm font-medium mb-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(seminar.date).toLocaleDateString(language === 'en' ? 'en-US' : 'ta-LK', { dateStyle: 'long' })}</span>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-foreground mb-2">
                    {language === 'en' ? seminar.titleEN : seminar.titleTA}
                  </h3>
                  <p className="text-muted-foreground mb-4 line-clamp-2">
                    {language === 'en' ? seminar.descriptionEN : seminar.descriptionTA}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {seminar.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {seminar.speakers} {language === 'en' ? 'Speakers' : 'பேச்சாளர்கள்'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Past Seminars */}
      <section className="py-16 md:py-24 bg-muted">
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-serif font-bold text-foreground mb-8"
          >
            {t('seminar.past')}
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-6">
            {pastSeminars.map((seminar, idx) => (
              <motion.div
                key={seminar.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-card rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(seminar.date).toLocaleDateString(language === 'en' ? 'en-US' : 'ta-LK', { dateStyle: 'long' })}</span>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-foreground mb-2">
                    {language === 'en' ? seminar.titleEN : seminar.titleTA}
                  </h3>
                  <p className="text-muted-foreground mb-4 line-clamp-2">
                    {language === 'en' ? seminar.descriptionEN : seminar.descriptionTA}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {seminar.location}
                    </span>
                    {seminar.bookletUrl && (
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        {t('seminar.download')}
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default SeminarPage;
