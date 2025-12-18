import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  Users,
  Calendar,
  MessageSquare,
  ChevronRight,
  Sparkles,
  GraduationCap,
  Heart,
  Zap
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import AnnouncementCarousel from '@/components/AnnouncementCarousel';

/* -------------------- Announcements -------------------- */
const announcements = [
  { id: 1, en: '📚 A/L Exam Preparation Seminar - January 2025', ta: '📚 உ.த. தேர்வு தயாரிப்பு கருத்தரங்கு - ஜனவரி 2025', type: 'event' as const },
  { id: 2, en: '🩸 Blood Donation Camp - Save Lives Today', ta: '🩸 இரத்ததான முகாம் - இன்றே உயிர்களைக் காப்பாற்றுங்கள்', type: 'urgent' as const },
  { id: 3, en: '🌳 Anbuchangamam Tree Planting Event - Join Us!', ta: '🌳 அன்புசங்கமம் மரம் நடும் நிகழ்வு - எங்களுடன் இணையுங்கள்!', type: 'event' as const },
  { id: 4, en: '🎓 New Scholarship Program Announced for 2025', ta: '🎓 2025 க்கான புதிய உதவித்தொகை திட்டம் அறிவிக்கப்பட்டது', type: 'news' as const },
];

/* -------------------- Annual Events (FINAL ORDER) -------------------- */
const annualEvents = [
  { id: 1, en: 'Practical Seminars', ta: 'நடைமுறை கருத்தரங்குகள்', icon: GraduationCap },
  { id: 2, en: 'Monthly Exam', ta: 'மாதாந்திர தேர்வு', icon: BookOpen },
  { id: 3, en: 'Kalvi Karam', ta: 'கல்வி கரம்', icon: Heart },
  { id: 4, en: 'Annual Exam', ta: 'வருடாந்திர தேர்வு', icon: BookOpen },
  { id: 5, en: 'Pentathlon', ta: 'பெண்டாத்லான்', icon: Zap },
  { id: 6, en: 'Innovia', ta: 'இனோவியா', icon: Sparkles },
  { id: 7, en: 'Anbuchangamam', ta: 'அன்புசங்கமம்', icon: Heart },
  { id: 8, en: 'Blood Donation Camp', ta: 'இரத்ததான முகாம்', icon: Heart },
  { id: 9, en: 'Medical Camp', ta: 'மருத்துவ முகாம்', icon: Heart },
  { id: 10, en: 'Cricket', ta: 'கிரிக்கெட்', icon: Zap },
];

/* -------------------- Stats -------------------- */
const stats = [
  { value: '500+', label: 'Students Helped', labelTA: 'உதவிய மாணவர்கள்' },
  { value: '50+', label: 'Events Organized', labelTA: 'நிகழ்வுகள்' },
  { value: '10+', label: 'Years of Service', labelTA: 'சேவை ஆண்டுகள்' },
  { value: '100%', label: 'Commitment', labelTA: 'அர்ப்பணிப்பு' },
];

const HomePage: React.FC = () => {
  const { language, t } = useLanguage();
  const [feedbackForm, setFeedbackForm] = useState({ message: '' });
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackForm.message.trim()) {
      toast.error(language === 'en' ? 'Please enter a message' : 'தயவுசெய்து செய்தியை உள்ளிடவும்');
      return;
    }
    toast.success(t('home.feedback.success'));
    setFeedbackForm({ message: '' });
  };

  return (
    <div className="relative overflow-hidden">
      <div className="pt-24">
        <AnnouncementCarousel announcements={announcements} />
      </div>

      {/* -------------------- Hero -------------------- */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-background" />
        <motion.div style={{ y, backgroundImage: 'var(--gradient-hero)' }} className="absolute inset-0" />

        <motion.div style={{ opacity }} className="container mx-auto px-4 relative z-10 py-32">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
              <span>{language === 'en' ? 'Building ' : 'எதிர்காலத்தை '}</span>
              <span className="gradient-text">{language === 'en' ? "Tomorrow's" : 'கட்டமைக்கும்'}</span>
              <br />
              <span>{language === 'en' ? 'Leaders Today' : 'இன்றைய தலைவர்கள்'}</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              {t('home.hero.subtitle')}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20">
              {stats.map((stat, idx) => (
                <div key={idx} className="glass-card rounded-2xl p-6 neon-glow-hover">
                  <div className="text-3xl font-bold gradient-text">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">
                    {language === 'en' ? stat.label : stat.labelTA}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* -------------------- What We Do -------------------- */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: BookOpen, label: 'Exams', desc: 'Academic assessments' },
              { icon: GraduationCap, label: 'Seminars', desc: 'Practical & academic seminars' },
              { icon: Calendar, label: 'Events', desc: 'Community & annual programs' },
              { icon: Users, label: 'Mentorship', desc: 'Guidance & leadership' },
            ].map((item, idx) => (
              <div key={idx} className="glass-card rounded-2xl p-8 text-center neon-glow-hover">
                <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">{item.label}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------- Annual Events Timeline -------------------- */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-primary/40 -translate-x-1/2" />
            <div className="space-y-12">
              {annualEvents.map((event, idx) => (
                <div key={event.id} className={`flex items-center gap-6 ${idx % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className={`flex-1 ${idx % 2 === 0 ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block glass-card rounded-2xl p-6 neon-glow-hover ${idx % 2 === 0 ? 'mr-6' : 'ml-6'}`}>
                      <p className="font-bold text-lg">
                        {language === 'en' ? event.en : event.ta}
                      </p>
                    </div>
                  </div>

                  <div className="relative z-10 w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-gold-light flex items-center justify-center neon-glow">
                    <event.icon className="w-6 h-6 text-primary-foreground" />
                  </div>

                  <div className="flex-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- Feedback -------------------- */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4 relative z-10 max-w-2xl">
          <form onSubmit={handleFeedbackSubmit} className="glass-card rounded-2xl p-8 space-y-6">
            <label className="block text-sm font-medium">
              {t('home.feedback.message')} *
            </label>
            <Textarea
              value={feedbackForm.message}
              onChange={(e) => setFeedbackForm({ message: e.target.value })}
              rows={5}
              placeholder={language === 'en' ? 'Your message...' : 'உங்கள் செய்தி...'}
              className="bg-background/50 border-border/50 focus:border-primary resize-none"
            />
            <Button type="submit" size="lg" className="w-full">
              {t('home.feedback.submit')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
