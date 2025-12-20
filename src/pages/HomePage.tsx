import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, BookOpen, Users, Calendar, MessageSquare, ChevronRight, Sparkles, GraduationCap, Heart, Zap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import AnnouncementCarousel from '@/components/AnnouncementCarousel';

// Sample announcements
const announcements = [
  {
    icon: BookOpen,
    label: language === 'en' ? 'Exams' : 'தேர்வுகள்',
    desc: language === 'en' ? 'Academic assessments' : 'கல்வி மதிப்பீடுகள்'
  },
  {
    icon: GraduationCap,
    label: language === 'en' ? 'Seminars' : 'கருத்தரங்குகள்',
    desc: language === 'en' ? 'Practical & academic seminars' : 'நடைமுறை மற்றும் கல்வி கருத்தரங்குகள்'
  },
  {
    icon: Calendar,
    label: language === 'en' ? 'Events' : 'நிகழ்வுகள்',
    desc: language === 'en' ? 'Community & annual programs' : 'சமூக மற்றும் ஆண்டு நிகழ்வுகள்'
  },
  {
    icon: Users,
    label: language === 'en' ? 'Mentorship' : 'வழிகாட்டுதல்',
    desc: language === 'en' ? 'Guidance & leadership' : 'வழிகாட்டல் மற்றும் தலைமை'
  }
]


// Sample events
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


// Sample committee
const committeePreview = [
  { id: 1, role: 'President', roleTA: 'தலைவர்', name: 'Dr. K. Suresh', batch: '2015' },
  { id: 2, role: 'Secretary', roleTA: 'செயலாளர்', name: 'Ms. T. Priya', batch: '2018' },
  { id: 3, role: 'Treasurer', roleTA: 'பொருளாளர்', name: 'Mr. S. Rajan', batch: '2017' },
];

const stats = [
  { value: '500+', label: 'Students Helped', labelTA: 'உதவிய மாணவர்கள்' },
  { value: '50+', label: 'Events Organized', labelTA: 'நிகழ்வுகள்' },
  { value: '10+', label: 'Years of Service', labelTA: 'சேவை ஆண்டுகள்' },
  { value: '100%', label: 'Commitment', labelTA: 'அர்ப்பணிப்பு' },
];

const HomePage: React.FC = () => {
  const { language, t } = useLanguage();
  const [feedbackForm, setFeedbackForm] = useState({ name: '', contact: '', message: '' });
  const heroRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackForm.message.trim()) {
      toast.error(language === 'en' ? 'Please enter a message' : 'தயவுசெய்து செய்தியை உள்ளிடவும்');
      return;
    }
    toast.success(t('home.feedback.success'));
    setFeedbackForm({ name: '', contact: '', message: '' });
  };

  return (
    <div className="relative overflow-hidden">
      {/* Announcement Carousel */}
      <div className="pt-24">
        <AnnouncementCarousel announcements={announcements} />
      </div>

      {/* Hero Section with Parallax */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-background" />
        <motion.div
          style={{ y, backgroundImage: 'var(--gradient-hero)' }}
          className="absolute inset-0"
        />
        
        {/* Animated glow orbs */}
        <motion.div 
          animate={{ 
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-[600px] h-[600px] -top-64 -right-64 rounded-full bg-primary/10 blur-3xl"
        />
        <motion.div 
          animate={{ 
            x: [0, -80, 0],
            y: [0, 80, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-[500px] h-[500px] -bottom-64 -left-64 rounded-full bg-secondary/15 blur-3xl"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-[400px] h-[400px] top-1/3 left-1/4 rounded-full bg-accent/15 blur-3xl"
        />

        {/* Content */}
        <motion.div 
          style={{ opacity }}
          className="container mx-auto px-4 relative z-10 py-32"
        >
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 glass-card px-4 py-2 rounded-full mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-sm text-muted-foreground">
                {language === 'en' ? 'Empowering Future Leaders Since 2015' : '2015 முதல் எதிர்கால தலைவர்களை மேம்படுத்துகிறோம்'}
              </span>
            </motion.div>

            {/* Main heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
            >
              <span className="text-foreground">{language === 'en' ? 'Building ' : 'எதிர்காலத்தை '}</span>
              <span className="gradient-text">{language === 'en' ? 'Tomorrow\'s' : 'கட்டமைக்கும்'}</span>
              <br />
              <span className="text-foreground">{language === 'en' ? 'Leaders Today' : 'இன்றைய தலைவர்கள்'}</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
            >
              {t('home.hero.subtitle')}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button asChild size="xl" className="group">
                <Link to="/about">
                  {t('home.hero.cta')}
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="xl" className="border-border/50 hover:border-primary/50 hover:bg-primary/5">
                <Link to="/events">
                  {t('nav.events')}
                </Link>
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20"
            >
              {stats.map((stat, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="glass-card rounded-2xl p-6 neon-glow-hover"
                >
                  <div className="text-3xl md:text-4xl font-bold gradient-text mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">
                    {language === 'en' ? stat.label : stat.labelTA}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-1"
          >
            <motion.div className="w-1.5 h-3 bg-primary rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* Who We Are */}
      <section className="py-24 relative">
        <div
          className="absolute inset-0 opacity-30"
          style={{ backgroundImage: 'var(--gradient-hero)' }}
        />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 glass-card px-4 py-2 rounded-full text-sm mb-6">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">{language === 'en' ? 'About Us' : 'எங்களைப் பற்றி'}</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                {language === 'en' ? 'Who ' : ''}
                <span className="gradient-text">{language === 'en' ? 'We Are' : 'நாங்கள் யார்?'}</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                {t('home.who.description')}
              </p>
              <Button asChild variant="outline" className="group border-border/50 hover:border-primary/50">
                <Link to="/about">
                  {language === 'en' ? 'Learn More' : 'மேலும் அறிய'}
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="glass-card rounded-3xl p-8 relative overflow-hidden transition-transform duration-300 hover:-translate-y-3 neon-glow-hover">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/10 rounded-full blur-3xl" />
                <div className="relative z-10 text-center py-12">
                  <BookOpen className="w-20 h-20 text-primary mx-auto mb-6" />
                  <h3 className="text-2xl font-bold mb-2">
                    {language === 'en' ? 'Empowering Education' : 'கல்வியை வலுப்படுத்துதல்'}
                  </h3>
                  <p className="text-muted-foreground">
                    {language === 'en' ? 'Since 2015' : '2015 முதல்'}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 glass-card px-4 py-2 rounded-full text-sm mb-6">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">{language === 'en' ? 'Our Programs' : 'எங்கள் திட்டங்கள்'}</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold">
              {language === 'en' ? 'What ' : ''}
              <span className="gradient-text">{language === 'en' ? 'We Do' : 'நாங்கள் என்ன செய்கிறோம்'}</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: BookOpen, label: language === 'en' ? 'Seminars' : 'கருத்தரங்குகள்', desc: language === 'en' ? 'Educational workshops' : 'கல்வி பட்டறைகள்' },
              { icon: Users, label: language === 'en' ? 'Mentorship' : 'வழிகாட்டுதல்', desc: language === 'en' ? 'Career guidance' : 'தொழில் வழிகாட்டுதல்' },
              { icon: Calendar, label: language === 'en' ? 'Events' : 'நிகழ்வுகள்', desc: language === 'en' ? 'Community programs' : 'சமூக திட்டங்கள்' },
              { icon: MessageSquare, label: language === 'en' ? 'Support' : 'ஆதரவு', desc: language === 'en' ? 'Student assistance' : 'மாணவர் உதவி' },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -10 }}
                className="glass-card rounded-2xl p-8 text-center neon-glow-hover group"
              >
                <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <item.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">{item.label}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Annual Events Timeline */}
      <section className="py-24 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'var(--gradient-hero)' }}
        />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              {language === 'en' ? 'Annual ' : 'வருடாந்த '}
              <span className="gradient-text">{language === 'en' ? 'Events' : 'நிகழ்வுகள்'}</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {language === 'en' 
                ? 'Our year-round activities designed to support and develop students' 
                : 'மாணவர்களை ஆதரிக்கவும் வளர்க்கவும் வடிவமைக்கப்பட்ட எங்கள் ஆண்டு முழுவதும் செயல்பாடுகள்'}
            </p>
          </motion.div>

          <div className="relative max-w-4xl mx-auto">
            {/* Timeline line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/50 to-transparent -translate-x-1/2" />
            
            <div className="space-y-12">
              {annualEvents.map((event, idx) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  className={`flex items-center gap-6 ${idx % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
                >
                  <div className={`flex-1 ${idx % 2 === 0 ? 'text-right' : 'text-left'}`}>
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      className={`inline-block glass-card rounded-2xl p-6 neon-glow-hover ${idx % 2 === 0 ? 'mr-6' : 'ml-6'}`}
                    >
                      
                      <p className="font-bold text-lg mt-2">
                        {language === 'en' ? event.en : event.ta}
                      </p>
                    </motion.div>
                  </div>
                  
                  {/* Center icon */}
                  <motion.div 
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    className="relative z-10 w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-gold-light flex items-center justify-center neon-glow flex-shrink-0"
                  >
                    <event.icon className="w-6 h-6 text-primary-foreground" />
                  </motion.div>
                  
                  <div className="flex-1" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Executive Committee */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              {language === 'en' ? 'Our ' : 'எங்கள் '}
              <span className="gradient-text">{language === 'en' ? 'Leadership' : 'தலைமை'}</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {committeePreview.map((member, idx) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                whileHover={{ y: -10 }}
                className="glass-card rounded-2xl p-8 text-center neon-glow-hover"
              >
                <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-gold-light flex items-center justify-center neon-glow">
                  <span className="text-3xl font-bold text-primary-foreground">
                    {member.name.charAt(0)}
                  </span>
                </div>
                <h3 className="font-bold text-xl mb-1">{member.name}</h3>
                <p className="text-primary font-medium mb-2">
                  {language === 'en' ? member.role : member.roleTA}
                </p>
                <p className="text-sm text-muted-foreground">
                  {language === 'en' ? 'Batch' : 'தொகுதி'} {member.batch}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Button asChild variant="outline" size="lg" className="group border-border/50 hover:border-primary/50">
              <Link to="/committee">
                {t('home.committee.viewAll')}
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Feedback Section */}
      <section className="py-24 relative">
        <div
          className="absolute inset-0 opacity-30"
          style={{ backgroundImage: 'var(--gradient-hero)' }}
        />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t('home.feedback.title')}
              </h2>
            </motion.div>

               <motion.form
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      onSubmit={handleFeedbackSubmit}
      className="glass-card rounded-2xl p-8 space-y-6"
    >
      <div>
        <label className="block text-sm font-medium mb-2">
          {t('home.feedback.message')} *
        </label>
        <Textarea
          value={feedbackForm.message}
          onChange={(e) => setFeedbackForm({ message: e.target.value })}
          placeholder={language === 'en' ? 'Your message...' : 'உங்கள் செய்தி...'}
          rows={5}
          className="bg-background/50 border-border/50 focus:border-primary resize-none"
        />
      </div>
    
      <Button type="submit" size="lg" className="w-full">
        {t('home.feedback.submit')}
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
</motion.form>

          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
