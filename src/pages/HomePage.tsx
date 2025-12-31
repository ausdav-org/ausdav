import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
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
  Zap,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import AnnouncementCarousel from "@/components/AnnouncementCarousel";
import ReviewCarousel from "@/components/ReviewCarousel";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Tables } from "@/integrations/supabase/types";
import heroBg from "@/assets/Home/BG1.jpg";

type AnnouncementRow = Tables<"announcements"> & {
  description_en?: string | null;
  description_ta?: string | null;
  announcement_id?: string;
  is_permanent?: boolean;
  category?: string | null;
};

type CarouselAnnouncement = {
  id: string;
  en: string;
  ta: string;
  type: "event" | "news" | "urgent";
};

const fallbackAnnouncements: CarouselAnnouncement[] = [
  {
    id: "seed-1",
    en: "📚 A/L Exam Preparation Seminar - January 2025",
    ta: "📚 உ.த. தேர்வு தயாரிப்பு கருத்தரங்கு - ஜனவரி 2025",
    type: "event",
  },
  {
    id: "seed-2",
    en: "🩸 Blood Donation Camp - Save Lives Today",
    ta: "🩸 இரத்ததான முகாம் - இன்றே உயிர்களைக் காப்பாற்றுங்கள்",
    type: "urgent",
  },
  {
    id: "seed-3",
    en: "🌳 Anbuchangamam Tree Planting Event - Join Us!",
    ta: "🌳 அன்புசங்கமம் மரம் நடும் நிகழ்வு - எங்களுடன் இணையுங்கள்!",
    type: "event",
  },
  {
    id: "seed-4",
    en: "🎓 New Scholarship Program Announced for 2025",
    ta: "🎓 2025 க்கான புதிய உதவித்தொகை திட்டம் அறிவிக்கப்பட்டது",
    type: "news",
  },
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

// Sample committee
const committeePreview = [
  {
    id: 1,
    role: "President",
    roleTA: "தலைவர்",
    name: "Dr. K. Suresh",
    batch: "2015",
  },
  {
    id: 2,
    role: "Secretary",
    roleTA: "செயலாளர்",
    name: "Ms. T. Priya",
    batch: "2018",
  },
  {
    id: 3,
    role: "Treasurer",
    roleTA: "பொருளாளர்",
    name: "Mr. S. Rajan",
    batch: "2017",
  },
];

// Executive designations to show on the Home page
const HOME_EXEC_DESIGNATIONS = [
  "president",
  "secretary",
  "treasurer",
  "editor",
  "web_designer",
];

const HOME_DESIGNATION_TO_ROLE: Record<string, { en: string; ta: string }> = {
  president: { en: "President", ta: "தலைவர்" },
  secretary: { en: "Secretary", ta: "செயலாளர்" },
  treasurer: { en: "Treasurer", ta: "பொருளாளர்" },
  editor: { en: "Editor", ta: "ஊடக தலைவர்" },
  web_designer: { en: "Web Developer", ta: "இணைய நிர்வாகி" },
};

const stats = [
  { value: "500+", label: "Students Helped", labelTA: "உதவிய மாணவர்கள்" },
  { value: "50+", label: "Events Organized", labelTA: "நிகழ்வுகள்" },
  { value: "10+", label: "Years of Service", labelTA: "சேவை ஆண்டுகள்" },
  { value: "100%", label: "Commitment", labelTA: "அர்ப்பணிப்பு" },
];

const HomePage: React.FC = () => {
  const { language, t } = useLanguage();
  const [feedbackForm, setFeedbackForm] = useState({
    name: "",
    contact: "",
    message: "",
  });
  const [announcements, setAnnouncements] = useState<CarouselAnnouncement[]>(
    fallbackAnnouncements
  );
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  const mapCategoryToType = (
    category?: string | null
  ): CarouselAnnouncement["type"] => {
    const normalized = (category || "").toLowerCase();
    if (normalized === "urgent") return "urgent";
    if (normalized === "event") return "event";
    return "news";
  };

  const buildAnnouncementText = (
    primary?: string | null,
    fallback?: string | null
  ) => {
    const text = primary?.trim() || fallback?.trim() || "";
    return text || "Announcement";
  };

  const loadAnnouncements = useCallback(async () => {
    setIsLoadingAnnouncements(true);
    const nowIso = new Date().toISOString();

    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const activeItems = (data || []).filter((item: AnnouncementRow) => {
        const withinStart = !item.start_at || item.start_at <= nowIso;
        const withinEnd =
          item.is_permanent || !item.end_at || item.end_at >= nowIso;
        return item.is_active !== false && withinStart && withinEnd;
      });

      const mapped = activeItems.map<CarouselAnnouncement>(
        (item: AnnouncementRow) => ({
          id: item.id || item.announcement_id || crypto.randomUUID(),
          en: buildAnnouncementText(
            item.description_en ?? item.message_en ?? item.title_en,
            item.title_en
          ),
          ta: buildAnnouncementText(
            item.description_ta ?? item.message_ta ?? item.title_ta,
            item.title_ta || item.description_en || item.title_en
          ),
          type: mapCategoryToType(item.category ?? item.tag ?? null),
        })
      );

      setAnnouncements(mapped.length ? mapped : fallbackAnnouncements);
    } catch (error) {
      console.error("Error loading announcements:", error);
      toast.error("Unable to load announcements right now.");
      setAnnouncements(fallbackAnnouncements);
    } finally {
      setIsLoadingAnnouncements(false);
    }
  }, []);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  // Fetch executive members for the Home page (current/latest batch)
  const { data: execRows } = useQuery<Tables<"members">[]>({
    queryKey: ["home-exec-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members")
        .select(
          "mem_id, fullname, designation, batch, university, uni_degree, profile_bucket, profile_path"
        )
        .in("designation", HOME_EXEC_DESIGNATIONS)
        .neq("designation", "none")
        .not("designation", "is", null)
        .order("batch", { ascending: false })
        .order("fullname", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Tables<"members">[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const execMembers = useMemo(() => {
    if (!execRows || execRows.length === 0) return [] as Tables<"members">[];
    const maxBatch = Math.max(...execRows.map((r) => r.batch || 0));
    const rows = execRows.filter((r) => (r.batch || 0) === maxBatch);
    return rows.map((r) => {
      const roleInfo = HOME_DESIGNATION_TO_ROLE[r.designation] || {
        en: r.designation,
        ta: r.designation,
      };
      const workParts: string[] = [];
      if (r.uni_degree) workParts.push(r.uni_degree);
      if (r.university) workParts.push(r.university);
      const work = workParts.join(",");
      let photo: string | null = null;
      if (r.profile_path && r.profile_bucket) {
        const { data } = supabase.storage
          .from(r.profile_bucket)
          .getPublicUrl(r.profile_path);
        photo = data?.publicUrl || null;
      }
      return {
        id: r.mem_id,
        role: roleInfo.en,
        roleTA: roleInfo.ta,
        name: r.fullname,
        nameTA: r.fullname,
        Work: work,
        batch: r.batch,
        photo,
      };
    });
  }, [execRows]);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackForm.message.trim()) {
      toast.error(
        language === "en"
          ? "Please enter a message"
          : "தயவுசெய்து செய்தியை உள்ளிடவும்"
      );
      return;
    }
    toast.success(t("home.feedback.success"));
    setFeedbackForm({ name: "", contact: "", message: "" });
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section with Parallax */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent to-black/70"></div>
        {/* Content */}
        <motion.div
          style={{ opacity }}
          className="container mx-auto px-4 relative z-10 py-32"
        >
          <div className="max-w-5xl mx-auto text-center">
            {/* Main heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-white"
            >
              <span className="text-lg md:text-xl lg:text-2xl block mb-2 text-cyan-400 italic">
                {language === "en" ? "Welcome to" : "வரவேற்கிறோம்"}
              </span>
              <span className="text-8xl md:text-9xl lg:text-10xl font-black">
                {language === "en" ? (
                  <>
                    <span className="text-white">AUS</span>
                    <span className="text-cyan-400">DAV</span>
                  </>
                ) : (
                  "AUSDAV"
                )}
              </span>
            </motion.h1>

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
                  className="bg-cyan-500/20 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/40 hover:border-cyan-500/60 hover:bg-cyan-500/30 transition-all duration-300"
                >
                  <div className="text-3xl md:text-4xl font-bold text-cyan-400 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-slate-300">
                    {language === "en" ? stat.label : stat.labelTA}
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

      {/* Announcement Carousel */}
      <div className="pt-8">
        <AnnouncementCarousel announcements={announcements} />
        {isLoadingAnnouncements && (
          <p className="text-center text-sm text-slate-400 mt-2">
            Loading announcements...
          </p>
        )}
      </div>

      {/* About Us and Events Section */}
      <section className="py-16 md:py-24 bg-slate-800/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* About Us Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-cyan-500/20 backdrop-blur-sm rounded-2xl p-8 border border-cyan-500/40 hover:border-cyan-500/60 hover:bg-cyan-500/30 transition-all duration-300"
            >
              <div className="text-left">
                <div className="w-16 h-16 mb-6 rounded-2xl bg-cyan-500/20 flex items-center justify-center">
                  <Users className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-4 text-white">
                  {language === "en" ? "About Us" : "எங்களைப் பற்றி"}
                </h3>
                <p className="text-slate-300 text-lg leading-relaxed mb-6">
                  {language === "en"
                    ? "Learn more about our mission, vision, and the dedicated team behind AUSDAV."
                    : "எங்கள் நோக்கம், பார்வை மற்றும் AUSDAV இன் பின்னால் உள்ள அர்ப்பணிப்பு குழுவைப் பற்றி மேலும் அறிக."}
                </p>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-cyan-500/40 hover:border-cyan-500/60 text-cyan-400 hover:text-cyan-300"
                >
                  <Link to="/about">
                    {language === "en" ? "Learn More" : "மேலும் அறிக"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </motion.div>

            {/* Events Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-cyan-500/20 backdrop-blur-sm rounded-2xl p-8 border border-cyan-500/40 hover:border-cyan-500/60 hover:bg-cyan-500/30 transition-all duration-300"
            >
              <div className="text-left">
                <div className="w-16 h-16 mb-6 rounded-2xl bg-cyan-500/20 flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-4 text-white">
                  {language === "en" ? "Events" : "நிகழ்வுகள்"}
                </h3>
                <p className="text-slate-300 text-lg leading-relaxed mb-6">
                  {language === "en"
                    ? "Discover our upcoming events, seminars, and activities that empower students."
                    : "மாணவர்களை வலுப்படுத்தும் எங்கள் வரவிருக்கும் நிகழ்வுகள், கருத்தரங்குகள் மற்றும் செயல்பாடுகளைக் கண்டறிக."}
                </p>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-cyan-500/40 hover:border-cyan-500/60 text-cyan-400 hover:text-cyan-300"
                >
                  <Link to="/events">
                    {language === "en" ? "View Events" : "நிகழ்வுகளைப் பார்க்க"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Executive Committee */}
      <section className="py-24 relative bg-slate-700/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">
              {language === "en" ? "Our " : "எங்கள் "}
              <span className="text-cyan-400">
                {language === "en" ? "Leadership" : "தலைமை"}
              </span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {(execMembers && execMembers.length
              ? execMembers
              : committeePreview
            ).map((member, idx) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                whileHover={{ y: -10 }}
                className="bg-cyan-500/20 backdrop-blur-sm rounded-2xl p-8 border border-cyan-500/40 hover:border-cyan-500/60 hover:bg-cyan-500/30 transition-all duration-300 text-center"
              >
                <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-cyan-400 flex items-center justify-center">
                  <span className="text-3xl font-bold text-slate-900">
                    {member.name.charAt(0)}
                  </span>
                </div>
                <h3 className="font-bold text-xl mb-1 text-white">
                  {member.name}
                </h3>
                <p className="text-cyan-400 font-medium mb-2">
                  {language === "en" ? member.role : member.roleTA}
                </p>
                <p className="text-sm text-muted-foreground">
                  {language === "en" ? "Batch" : "தொகுதி"} {member.batch}
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
            <Button
              asChild
              variant="outline"
              size="lg"
              className="group border-cyan-500/40 hover:border-cyan-500/60 text-cyan-400 hover:text-cyan-300"
            >
              <Link to="/committee">
                {t("home.committee.viewAll")}
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Testimonials / Reviews Carousel */}
      <section className="py-24 bg-slate-800/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              {language === "en" ? "CLIENT REVIEWS" : "கிளையன்ட் மதிப்புரைகள்"}
            </h2>
          </div>

          <ReviewCarousel
            reviews={[
              {
                en: "I have known and worked closely with Rick and Liza Looser, and the fine folks at The Agency, for almost two decades and feel fully confident in expressing my endorsement.",
                ta: "நான் Rick மற்றும் Liza Looser ஆகியோருடன் பணி செய்துள்ளேன்.",
                author: "Nina Perry",
                image: "👩‍💼",
              },
              {
                en: "Exceptional service and outstanding results. Their team goes above and beyond to ensure every project is completed to perfection.",
                ta: "விதிவிலக்கான சேவை மற்றும் சிறந்த முடிவுகள்.",
                author: "John Smith",
                image: "👨‍💼",
              },
              {
                en: "Professional, reliable, and passionate about their work. They deliver excellence in every aspect.",
                ta: "தொழில்முறை, நம்பகமான மற்றும் தங்கள் வேலையில் ஆர்வமுள்ளவர்கள்.",
                author: "Sarah Johnson",
                image: "👩‍🔬",
              },
            ]}
            language={language}
          />
        </div>
      </section>

      {/* Feedback Section */}
      <section className="py-24 relative bg-slate-700/30">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-cyan-500/20 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-cyan-400" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                {t("home.feedback.title")}
              </h2>
            </motion.div>

            <motion.form
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              onSubmit={handleFeedbackSubmit}
              className="bg-cyan-500/20 backdrop-blur-sm rounded-2xl p-8 space-y-6 border border-cyan-500/40"
            >
              <div>
                <label className="block text-sm font-medium mb-2 text-white">
                  {t("home.feedback.message")} *
                </label>
                <Textarea
                  value={feedbackForm.message}
                  onChange={(e) =>
                    setFeedbackForm((prev) => ({
                      ...prev,
                      message: e.target.value,
                    }))
                  }
                  placeholder={
                    language === "en" ? "Your message..." : "உங்கள் செய்தி..."
                  }
                  rows={5}
                  className="bg-slate-800/50 border-cyan-500/40 focus:border-cyan-500/60 text-white placeholder-slate-400 resize-none"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-900"
              >
                {t("home.feedback.submit")}
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
