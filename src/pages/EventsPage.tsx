import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, ChevronRight, Image } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

type EventRecord = {
  id: string;
  title_en: string;
  title_ta: string | null;
  description_en: string | null;
  description_ta: string | null;
  event_date: string;
  location: string | null;
  is_active: boolean;
  image_bucket: string | null;
  image_path: string | null;
};

type EventDisplay = {
  id: string;
  titleEN: string;
  titleTA: string | null;
  descriptionEN: string | null;
  descriptionTA: string | null;
  date: string;
  location: string | null;
  isUpcoming: boolean;
  coverImage: string | null;
};

// Past year galleries
const pastGalleries = [
  { year: '2024', count: 45 },
  { year: '2023', count: 38 },
  { year: '2022', count: 52 },
  { year: '2021', count: 28 },
];

const EventsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [events, setEvents] = useState<EventDisplay[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const hasNoEvents = !isLoadingEvents && !fetchError && events.length === 0;

  useEffect(() => {
    const loadEvents = async () => {
      setIsLoadingEvents(true);
      setFetchError(null);

      const { data, error } = await supabase
        .from('events' as any)
        .select(
          'id,title_en,title_ta,description_en,description_ta,event_date,location,is_active,image_bucket,image_path'
        )
        .eq('is_active', true)
        .order('event_date', { ascending: false });

      if (error) {
        setFetchError(error.message);
        setIsLoadingEvents(false);
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const records = (data ?? []) as unknown as EventRecord[];

      const mapped: EventDisplay[] = records.map((event) => {
        const imageUrl = event.image_path
          ? supabase.storage
              .from(event.image_bucket || 'events')
              .getPublicUrl(event.image_path).data?.publicUrl || null
          : null;

        const eventDate = event.event_date || '';
        const isUpcoming = eventDate ? new Date(eventDate) >= today : false;

        return {
          id: event.id,
          titleEN: event.title_en,
          titleTA: event.title_ta,
          descriptionEN: event.description_en,
          descriptionTA: event.description_ta,
          date: eventDate,
          location: event.location,
          isUpcoming,
          coverImage: imageUrl,
        };
      });

      setEvents(mapped);
      setIsLoadingEvents(false);
    };

    loadEvents();
  }, []);

  const allEvents = events;

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

      {/* Events */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-serif font-bold text-foreground mb-8"
          >
            {t('events.title')}
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-6">
            {isLoadingEvents && (
              <div className="col-span-2 text-center py-8 text-muted-foreground">Loading events...</div>
            )}
            {fetchError && !isLoadingEvents && (
              <div className="col-span-2 text-center py-8 text-destructive">
                {fetchError.includes('column events.id does not exist')
                  ? 'The events table is not properly set up. Please run the latest migration.'
                  : fetchError}
              </div>
            )}
            {hasNoEvents && (
              <div className="col-span-2 text-center py-8 text-muted-foreground">No events to show yet.</div>
            )}
            {!isLoadingEvents && !fetchError && allEvents.map((event, idx) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all group"
              >
                <div className="h-48 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                  {event.coverImage ? (
                    <div
                      className="w-full h-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${event.coverImage})` }}
                    />
                  ) : (
                    <div className="text-center">
                      <Calendar className="w-12 h-12 text-secondary mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.date).toLocaleDateString(language === 'en' ? 'en-US' : 'ta-LK', { dateStyle: 'long' })}
                      </p>
                    </div>
                  )}
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
    </div>
  );
};

export default EventsPage;
