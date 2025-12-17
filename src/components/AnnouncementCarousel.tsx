import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles, Calendar, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

interface Announcement {
  id: number;
  en: string;
  ta: string;
  type?: 'event' | 'news' | 'urgent';
}

interface AnnouncementCarouselProps {
  announcements: Announcement[];
}

const typeStyles = {
  event: {
    bg: 'from-primary/20 to-primary/5',
    icon: Calendar,
    label: { en: 'Event', ta: 'நிகழ்வு' },
    border: 'border-primary/30',
  },
  news: {
    bg: 'from-accent/20 to-accent/5',
    icon: Sparkles,
    label: { en: 'News', ta: 'செய்தி' },
    border: 'border-accent/30',
  },
  urgent: {
    bg: 'from-destructive/20 to-destructive/5',
    icon: Sparkles,
    label: { en: 'Urgent', ta: 'அவசரம்' },
    border: 'border-destructive/30',
  },
};

const AnnouncementCarousel: React.FC<AnnouncementCarouselProps> = ({ announcements }) => {
  const { language } = useLanguage();

  return (
    <section className="py-6 relative">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2 glass-card px-3 py-1.5 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-sm font-semibold text-foreground">
              {language === 'en' ? 'Announcements' : 'அறிவிப்புகள்'}
            </span>
          </div>
        </div>

        <Carousel
          opts={{
            align: 'start',
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {announcements.map((announcement, idx) => {
              const type = announcement.type || 'news';
              const style = typeStyles[type];
              const Icon = style.icon;

              return (
                <CarouselItem key={announcement.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className={`glass-card rounded-2xl p-6 h-full border ${style.border} neon-glow-hover cursor-pointer group`}
                  >
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${style.bg} opacity-50`} />
                    
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                          {language === 'en' ? style.label.en : style.label.ta}
                        </span>
                      </div>
                      
                      <p className="text-foreground font-medium leading-relaxed mb-4">
                        {language === 'en' ? announcement.en : announcement.ta}
                      </p>
                      
                      <div className="flex items-center text-primary text-sm font-medium group-hover:gap-2 transition-all">
                        <span>{language === 'en' ? 'Learn more' : 'மேலும் அறிய'}</span>
                        <ArrowRight className="w-4 h-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                      </div>
                    </div>
                  </motion.div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          
          <div className="flex items-center justify-end gap-2 mt-4">
            <CarouselPrevious className="static translate-y-0 glass-card border-border/30 hover:bg-primary/10 hover:text-primary" />
            <CarouselNext className="static translate-y-0 glass-card border-border/30 hover:bg-primary/10 hover:text-primary" />
          </div>
        </Carousel>
      </div>
    </section>
  );
};

export default AnnouncementCarousel;