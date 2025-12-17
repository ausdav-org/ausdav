import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

// Sample committee data
const committeeMembers = [
  { id: 1, role: 'President', roleTA: 'தலைவர்', name: 'Dr. K. Suresh', nameTA: 'டாக்டர். கே. சுரேஷ்', batch: '2015', photo: null },
  { id: 2, role: 'Vice President', roleTA: 'துணைத் தலைவர்', name: 'Mr. A. Kumar', nameTA: 'திரு. ஏ. குமார்', batch: '2016', photo: null },
  { id: 3, role: 'Secretary', roleTA: 'செயலாளர்', name: 'Ms. T. Priya', nameTA: 'செல்வி. டி. பிரியா', batch: '2018', photo: null },
  { id: 4, role: 'Treasurer', roleTA: 'பொருளாளர்', name: 'Mr. S. Rajan', nameTA: 'திரு. எஸ். ராஜன்', batch: '2017', photo: null },
  { id: 5, role: 'Coordinator', roleTA: 'ஒருங்கிணைப்பாளர்', name: 'Ms. N. Lakshmi', nameTA: 'செல்வி. என். லட்சுமி', batch: '2019', photo: null },
  { id: 6, role: 'Media Head', roleTA: 'ஊடக தலைவர்', name: 'Mr. V. Arun', nameTA: 'திரு. வி. அருண்', batch: '2020', photo: null },
  { id: 7, role: 'Event Coordinator', roleTA: 'நிகழ்வு ஒருங்கிணைப்பாளர்', name: 'Ms. M. Divya', nameTA: 'செல்வி. எம். திவ்யா', batch: '2019', photo: null },
  { id: 8, role: 'Member', roleTA: 'உறுப்பினர்', name: 'Mr. R. Prakash', nameTA: 'திரு. ஆர். பிரகாஷ்', batch: '2021', photo: null },
];

const CommitteePage: React.FC = () => {
  const { t, language } = useLanguage();

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
              {t('committee.title')}
            </h1>
            <p className="text-foreground/80 text-lg">
              {t('committee.subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Committee Grid */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {committeeMembers.map((member, idx) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="bg-card rounded-xl p-6 text-center shadow-md hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
                  <span className="text-3xl font-serif font-bold text-primary-foreground">
                    {member.name.split(' ').pop()?.charAt(0)}
                  </span>
                </div>
                <h3 className="font-serif font-semibold text-foreground text-lg">
                  {language === 'en' ? member.name : member.nameTA}
                </h3>
                <p className="text-secondary font-medium text-sm mt-1">
                  {language === 'en' ? member.role : member.roleTA}
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  {language === 'en' ? 'Batch' : 'தொகுதி'} {member.batch}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CommitteePage;
