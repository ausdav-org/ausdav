import React from 'react';
import { motion } from 'framer-motion';
import { Target, Eye, Heart, Users, BookOpen, Award, Lightbulb } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const AboutPage: React.FC = () => {
  const { t, language } = useLanguage();

  const values = [
    { icon: Heart, en: 'Compassion', ta: 'இரக்கம்' },
    { icon: BookOpen, en: 'Excellence', ta: 'சிறப்பு' },
    { icon: Users, en: 'Community', ta: 'சமூகம்' },
    { icon: Lightbulb, en: 'Innovation', ta: 'புதுமை' },
  ];

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
              {t('about.title')}
            </h1>
            <p className="text-foreground/80 text-lg">
              {language === 'en'
                ? 'Dedicated to empowering students and transforming communities'
                : 'மாணவர்களை வலுப்படுத்துவதற்கும் சமூகங்களை மாற்றுவதற்கும் அர்ப்பணிக்கப்பட்டது'}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Who We Are */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 bg-secondary/20 px-3 py-1 rounded-full text-sm font-medium mb-4">
                <Users className="w-4 h-4 text-secondary" />
                <span>{language === 'en' ? 'Our Identity' : 'எங்கள் அடையாளம்'}</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-6">
                {t('about.who.title')}
              </h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                {t('about.who.content')}
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square max-w-md mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-8 flex items-center justify-center shadow-xl">
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-secondary/20 flex items-center justify-center">
                    <span className="text-6xl font-serif font-bold text-secondary">A</span>
                  </div>
                  <p className="text-primary-foreground font-serif font-semibold text-xl">AUSDAV</p>
                  <p className="text-primary-foreground/70 text-sm mt-2">
                    {language === 'en' ? 'Est. 2015' : 'நிறுவப்பட்டது 2015'}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="py-16 md:py-24 bg-muted">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 bg-secondary/20 px-3 py-1 rounded-full text-sm font-medium mb-4">
              <Award className="w-4 h-4 text-secondary" />
              <span>{language === 'en' ? 'Our Work' : 'எங்கள் பணி'}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-6">
              {t('about.what.title')}
            </h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              {t('about.what.content')}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {values.map((value, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-card rounded-xl p-6 text-center shadow-md hover:shadow-lg transition-shadow"
              >
                <value.icon className="w-10 h-10 text-secondary mx-auto mb-3" />
                <p className="font-semibold text-foreground">
                  {language === 'en' ? value.en : value.ta}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Vision */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-primary rounded-2xl p-8 md:p-10"
            >
              <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mb-6">
                <Eye className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-2xl md:text-3xl font-serif font-bold text-primary-foreground mb-4">
                {t('about.vision.title')}
              </h3>
              <p className="text-primary-foreground/80 leading-relaxed text-lg">
                {t('about.vision.content')}
              </p>
            </motion.div>

            {/* Mission */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-secondary to-secondary/90 rounded-2xl p-8 md:p-10"
            >
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                <Target className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl md:text-3xl font-serif font-bold text-secondary-foreground mb-4">
                {t('about.mission.title')}
              </h3>
              <p className="text-secondary-foreground/80 leading-relaxed text-lg">
                {t('about.mission.content')}
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
