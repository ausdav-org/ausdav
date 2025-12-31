import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Calendar,
  MapPin,
  ChevronRight,
  Image,
  GraduationCap,
  BookOpen,
  Heart,
  Zap,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

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
  { year: "2024", count: 45 },
  { year: "2023", count: 38 },
  { year: "2022", count: 52 },
  { year: "2021", count: 28 },
];

// Sample events
const annualEvents = [
  {
    id: 1,
    en: "Practical Seminars",
    ta: "நடைமுறை கருத்தரங்குகள்",
    icon: GraduationCap,
  },
  { id: 2, en: "Monthly Exam", ta: "மாதாந்திர தேர்வு", icon: BookOpen },
  { id: 3, en: "Kalvi Karam", ta: "கல்வி கரம்", icon: Heart },
  { id: 4, en: "Annual Exam", ta: "வருடாந்திர தேர்வு", icon: BookOpen },
  { id: 5, en: "Pentathlon", ta: "பெண்டாத்லான்", icon: Zap },
  { id: 6, en: "Innovia", ta: "இனோவியா", icon: Sparkles },
  { id: 7, en: "Anbuchangamam", ta: "அன்புசங்கமம்", icon: Heart },
  { id: 8, en: "Blood Donation Camp", ta: "இரத்ததான முகாம்", icon: Heart },
  { id: 9, en: "Medical Camp", ta: "மருத்துவ முகாம்", icon: Heart },
  { id: 10, en: "Cricket", ta: "கிரிக்கெட்", icon: Zap },
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
        .from("events" as any)
        .select(
          "id,title_en,title_ta,description_en,description_ta,event_date,location,is_active,image_bucket,image_path"
        )
        .eq("is_active", true)
        .order("event_date", { ascending: false });

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
              .from(event.image_bucket || "events")
              .getPublicUrl(event.image_path).data?.publicUrl || null
          : null;

        const eventDate = event.event_date || "";
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
        style={{ backgroundImage: "var(--gradient-hero)" }}
      >
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
              {t("events.title")}
            </h1>
            <p className="text-foreground/80 text-lg">
              {language === "en"
                ? "Discover our upcoming events and explore memories from past activities"
                : "எங்கள் வரவிருக்கும் நிகழ்வுகளைக் கண்டறியுங்கள் மற்றும் கடந்த செயல்பாடுகளின் நினைவுகளை ஆராயுங்கள்"}
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
            {t("events.title")}
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-6">
            {isLoadingEvents && (
              <div className="col-span-2 text-center py-8 text-muted-foreground">
                Loading events...
              </div>
            )}
            {fetchError && !isLoadingEvents && (
              <div className="col-span-2 text-center py-8 text-destructive">
                {fetchError.includes("column events.id does not exist")
                  ? "The events table is not properly set up. Please run the latest migration."
                  : fetchError}
              </div>
            )}
            {hasNoEvents && (
              <div className="col-span-2 text-center py-8 text-muted-foreground">
                No events to show yet.
              </div>
            )}
            {!isLoadingEvents &&
              !fetchError &&
              allEvents.map((event, idx) => (
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
                          {new Date(event.date).toLocaleDateString(
                            language === "en" ? "en-US" : "ta-LK",
                            { dateStyle: "long" }
                          )}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-serif font-bold text-foreground mb-2 group-hover:text-secondary transition-colors">
                      {language === "en" ? event.titleEN : event.titleTA}
                    </h3>
                    <p className="text-muted-foreground mb-4 line-clamp-2">
                      {language === "en"
                        ? event.descriptionEN
                        : event.descriptionTA}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </span>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/events/${event.id}`}>
                          {t("events.viewDetails")}
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

      {/* Annual Events Timeline */}
      <section className="py-24 relative overflow-hidden bg-slate-800/50">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">
              {language === "en" ? "Annual " : "வருடாந்த "}
              <span className="text-cyan-400">
                {language === "en" ? "Events" : "நிகழ்வுகள்"}
              </span>
            </h2>
            <p className="text-slate-300 max-w-2xl mx-auto">
              {language === "en"
                ? "Our year-round activities designed to support and develop students"
                : "மாணவர்களை ஆதரிக்கவும் வளர்க்கவும் வடிவமைக்கப்பட்ட எங்கள் ஆண்டு முழுவதும் செயல்பாடுகள்"}
            </p>
          </motion.div>

          <div className="relative max-w-4xl mx-auto">
            {/* Timeline line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-cyan-500/50 to-transparent -translate-x-1/2" />

            <div className="space-y-12">
              {annualEvents.map((event, idx) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  className={`flex items-center gap-6 ${
                    idx % 2 === 0 ? "flex-row" : "flex-row-reverse"
                  }`}
                >
                  <div
                    className={`flex-1 ${
                      idx % 2 === 0 ? "text-right" : "text-left"
                    }`}
                  >
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className={`inline-block bg-cyan-500/20 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/40 hover:border-cyan-500/60 hover:bg-cyan-500/30 transition-all duration-300 ${
                        idx % 2 === 0 ? "mr-6" : "ml-6"
                      }`}
                    >
                      <p className="font-bold text-lg mt-2 text-white">
                        {language === "en" ? event.en : event.ta}
                      </p>
                    </motion.div>
                  </div>

                  {/* Center icon */}
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    className="relative z-10 w-14 h-14 rounded-xl bg-cyan-400 flex items-center justify-center flex-shrink-0"
                  >
                    <event.icon className="w-6 h-6 text-slate-900" />
                  </motion.div>

                  <div className="flex-1" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EventsPage;
