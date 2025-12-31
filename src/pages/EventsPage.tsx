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
import BG1 from "@/assets/AboutUs/BG1.jpg";

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
    <div className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section with Background Image */}
      <section
        className="relative min-h-screen bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.6), rgba(15, 23, 42, 0.6)), url('${BG1}')`,
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center z-10 px-4"
        >
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-cyan-400 text-sm font-semibold mb-4 uppercase tracking-widest"
          >
            ✦{" "}
            {language === "en"
              ? "Empowering Future Leaders Since 2015"
              : "2015 முதல் ஆற்றல் சேர்ப்பு"}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6"
          >
            {language === "en" ? "Annual " : "வருடாந்த "}
            <span className="text-cyan-400">
              {language === "en" ? "Events" : "நிகழ்வுகள்"}
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto"
          >
            {language === "en"
              ? "Discover our upcoming events and explore memories from past activities"
              : "எங்கள் வரவிருக்கும் நிகழ்வுகளைக் கண்டறியுங்கள் மற்றும் கடந்த செயல்பாடுகளின் நினைவுகளை ஆராயுங்கள்"}
          </motion.p>
        </motion.div>
      </section>

      {/* Annual Events Timeline */}
      <section className="py-24 relative overflow-hidden bg-slate-800/50">
        <div className="container mx-auto px-4 relative z-10">
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
