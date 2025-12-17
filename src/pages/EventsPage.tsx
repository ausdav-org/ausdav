import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, ChevronRight, Image } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

// Sample events
const events = [
  {
    id: 1,
    titleEN: 'Anbuchangamam 2025',
    titleTA: 'அன்புசங்கமம் 2025',
    descriptionEN: 'Annual gathering celebrating community bonds and student achievements. Join us for a day of cultural performances, awards, and networking.',
    descriptionTA: 'சமூக பிணைப்புகள் மற்றும் மாணவர் சாதனைகளை கொண்டாடும் வருடாந்த கூட்டம். கலாச்சார நிகழ்ச்சிகள், விருதுகள் மற்றும் வலைப்பின்னலுக்கான ஒரு நாளில் எங்களுடன் இணையுங்கள்.',
    date: '2025-07-15',
    location: 'Vavuniya Town Hall',
    isUpcoming: true,
    coverImage: null,
  },
  {
    id: 2,
    titleEN: 'Blood Donation Camp 2025',
    titleTA: 'இரத்ததான முகாம் 2025',
    descriptionEN: 'Save lives by donating blood. Our annual blood donation camp in partnership with the National Blood Bank.',
    descriptionTA: 'இரத்தம் தானம் செய்து உயிர்களைக் காப்பாற்றுங்கள். தேசிய இரத்த வங்கியுடன் கூட்டாக எங்கள் வருடாந்த இரத்ததான முகாம்.',
    date: '2025-09-20',
    location: 'Vavuniya General Hospital',
    isUpcoming: true,
    coverImage: null,
  },
  {
    id: 3,
    titleEN: 'A/L Exam Revision Program 2024',
    titleTA: 'உ.த. தேர்வு திருத்தத் திட்டம் 2024',
    descriptionEN: 'Intensive revision sessions for A/L students covering all major subjects with expert teachers.',
    descriptionTA: 'நிபுணர் ஆசிரியர்களுடன் அனைத்து முக்கிய பாடங்களையும் உள்ளடக்கிய உ.த. மாணவர்களுக்கான தீவிர திருத்த அமர்வுகள்.',
    date: '2024-12-10',
    location: 'Multiple Venues',
    isUpcoming: false,
    coverImage: null,
  },
  {
    id: 4,
    titleEN: 'Tree Planting Drive 2024',
    titleTA: 'மரம் நடும் இயக்கம் 2024',
    descriptionEN: 'Environmental initiative planting 1000+ trees across Vavuniya district for a greener future.',
    descriptionTA: 'பசுமையான எதிர்காலத்திற்காக வவுனியா மாவட்டம் முழுவதும் 1000+ மரங்களை நடும் சுற்றுச்சூழல் முன்முயற்சி.',
    date: '2024-06-05',
    location: 'Vavuniya Schools',
    isUpcoming: false,
    coverImage: null,
  },
];

// Past year galleries
const pastGalleries = [
  { year: '2024', count: 45 },
  { year: '2023', count: 38 },
  { year: '2022', count: 52 },
  { year: '2021', count: 28 },
];

const EventsPage: React.FC = () => {
  const { t, language } = useLanguage();

  const upcomingEvents = events.filter((e) => e.isUpcoming);
  const pastEvents = events.filter((e) => !e.isUpcoming);

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
              {t('events.title')}
            </h1>
            <p className="text-foreground/80 text-lg">
              {language === 'en'
                ? 'Discover our upcoming events and explore memories from past activities'
                : 'எங்கள் வரவிருக்கும் நிகழ்வுகளைக் கண்டறியுங்கள் மற்றும் கடந்த செயல்பாடுகளின் நினைவுகளை ஆராயுங்கள்'}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-serif font-bold text-foreground mb-8"
          >
            {t('events.upcoming')}
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-6">
            {upcomingEvents.map((event, idx) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all group"
              >
                {/* Cover Image Placeholder */}
                <div className="h-48 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                  <div className="text-center">
                    <Calendar className="w-12 h-12 text-secondary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.date).toLocaleDateString(language === 'en' ? 'en-US' : 'ta-LK', { dateStyle: 'long' })}
                    </p>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-serif font-bold text-foreground mb-2 group-hover:text-secondary transition-colors">
                    {language === 'en' ? event.titleEN : event.titleTA}
                  </h3>
                  <p className="text-muted-foreground mb-4 line-clamp-2">
                    {language === 'en' ? event.descriptionEN : event.descriptionTA}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {event.location}
                    </span>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/events/${event.id}`}>
                        {t('events.viewDetails')}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Past Events */}
      <section className="py-16 md:py-24 bg-muted">
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-serif font-bold text-foreground mb-8"
          >
            {t('events.past')}
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {pastEvents.map((event, idx) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-card rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(event.date).toLocaleDateString(language === 'en' ? 'en-US' : 'ta-LK', { dateStyle: 'long' })}</span>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-foreground mb-2">
                    {language === 'en' ? event.titleEN : event.titleTA}
                  </h3>
                  <p className="text-muted-foreground mb-4 line-clamp-2">
                    {language === 'en' ? event.descriptionEN : event.descriptionTA}
                  </p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {event.location}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Photo Gallery Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-serif font-bold text-foreground mb-6">
              {t('events.gallery')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {pastGalleries.map((gallery, idx) => (
                <motion.button
                  key={gallery.year}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-card rounded-xl p-6 text-center shadow-md hover:shadow-lg hover:-translate-y-1 transition-all group"
                >
                  <Image className="w-8 h-8 text-secondary mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="font-serif font-bold text-2xl text-foreground">{gallery.year}</p>
                  <p className="text-sm text-muted-foreground">
                    {gallery.count} {language === 'en' ? 'photos' : 'புகைப்படங்கள்'}
                  </p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default EventsPage;
