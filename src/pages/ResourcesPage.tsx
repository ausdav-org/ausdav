import React, { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Download, MapPin, Users, FileText } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BG1 from "@/assets/AboutUs/BG1.jpg";

type Seminar = {
  sem_id: number;
  yrs: number;
  seminar_paper_bucket: string;
  seminar_paper_path: string | null;
  answers_bucket: string;
  answers_path: string | null;
  created_at: string;
  updated_at: string;
};

type PastPaper = {
  pp_id: number;
  yrs: number;
  subject: string;
  exam_paper_bucket?: string;
  exam_paper_path: string | null;
  scheme_bucket?: string;
  scheme_path: string | null;
  created_at: string;
  updated_at: string;
};

const ResourcesPage: React.FC = () => {
  const { t, language } = useLanguage();

  const seminarRef = useRef<HTMLDivElement>(null);
  const pastPaperRef = useRef<HTMLDivElement>(null);
  const [openSeminarYear, setOpenSeminarYear] = useState<number | null>(null);
  const [openPastPaperYear, setOpenPastPaperYear] = useState<number | null>(null);

  // Fetch seminars from database
  const { data: seminars = [], isLoading: seminarsLoading } = useQuery({
    queryKey: ["seminars"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seminars")
        .select("*")
        .order("yrs", { ascending: false });

      if (error) throw error;
      return data as Seminar[];
    },
  });

  // Fetch past papers from database
  const { data: pastPapers = [], isLoading: pastPapersLoading } = useQuery({
    queryKey: ["past-papers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("past_papers")
        .select("*")
        .order("yrs", { ascending: false });

      if (error) throw error;
      return data as PastPaper[];
    },
  });

  const openDownload = (
    resource: Seminar | PastPaper,
    type: "paper" | "answers" | "scheme",
    isSeminar: boolean
  ) => {
    let bucket: string;
    let path: string | null;

    if (isSeminar) {
      const seminar = resource as Seminar;
      bucket =
        type === "paper"
          ? seminar.seminar_paper_bucket
          : seminar.answers_bucket;
      path =
        type === "paper" ? seminar.seminar_paper_path : seminar.answers_path;
    } else {
      const paper = resource as PastPaper;
      if (type === "paper") {
        bucket = "exam-papers";
        path = paper.exam_paper_path;
      } else {
        bucket = paper.scheme_bucket || "schemes";
        path = paper.scheme_path;
      }
    }

    if (!path) {
      const typeLabel =
        type === "paper"
          ? language === "en"
            ? "Paper"
            : "தாள்"
          : type === "answers"
          ? language === "en"
            ? "Answers"
            : "பதில்கள்"
          : language === "en"
          ? "Scheme"
          : "திட்டம்";
      toast.error(
        language === "en"
          ? `${typeLabel} not available`
          : `${typeLabel} கிடைக்கவில்லை`
      );
      return;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    if (data?.publicUrl) {
      window.open(data.publicUrl, "_blank");
    } else {
      toast.error(
        language === "en"
          ? "Download link not available"
          : "பதிவிறக்க இணைப்பு கிடைக்கவில்லை"
      );
    }
  };

  const seminarYears = useMemo(() => {
    const years: number[] = [];
    const seen = new Set<number>();

    for (const seminar of seminars) {
      if (seen.has(seminar.yrs)) continue;
      seen.add(seminar.yrs);
      years.push(seminar.yrs);
    }

    return years;
  }, [seminars]);

  const seminarsByYear = useMemo(() => {
    const grouped = new Map<number, Seminar[]>();

    for (const seminar of seminars) {
      const existing = grouped.get(seminar.yrs);
      if (existing) {
        existing.push(seminar);
      } else {
        grouped.set(seminar.yrs, [seminar]);
      }
    }

    return grouped;
  }, [seminars]);

  const pastPaperYears = useMemo(() => {
    const years: number[] = [];
    const seen = new Set<number>();

    for (const paper of pastPapers) {
      if (seen.has(paper.yrs)) continue;
      seen.add(paper.yrs);
      years.push(paper.yrs);
    }

    return years;
  }, [pastPapers]);

  const pastPapersByYear = useMemo(() => {
    const grouped = new Map<number, PastPaper[]>();

    for (const paper of pastPapers) {
      const existing = grouped.get(paper.yrs);
      if (existing) {
        existing.push(paper);
      } else {
        grouped.set(paper.yrs, [paper]);
      }
    }

    return grouped;
  }, [pastPapers]);

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
            {language === "en" ? (
              <>
                Resou<span className="text-cyan-400">rces</span>
              </>
            ) : (
              t("resources.title")
            )}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto"
          >
            {language === "en"
              ? "Download seminar papers, answers, and past papers to enhance your learning"
              : "உங்கள் கல்வியை மேம்படுத்துவதற்கு செமினார் தாள்கள், பதில்கள் மற்றும் கடந்த கால வினாத்தாள்களை பதிவிறக்கவும்"}
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex gap-6 justify-center mt-20"
          >
            <Button
              onClick={() =>
                seminarRef.current?.scrollIntoView({ behavior: "smooth" })
              }
              className="bg-cyan-500 hover:bg-cyan-600 hover:shadow-cyan-500 hover:shadow-lg text-white transition-all duration-300"
            >
              {language === "en" ? "Seminar" : "செமினார்"}
            </Button>
            <Button
              onClick={() =>
                pastPaperRef.current?.scrollIntoView({ behavior: "smooth" })
              }
              className="bg-cyan-500 hover:bg-cyan-600 hover:shadow-cyan-500 hover:shadow-lg text-white transition-all duration-300"
            >
              {language === "en" ? "Past Paper" : "கடந்த கால வினாத்தாள்"}
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Past Papers */}
      <section ref={pastPaperRef} className="py-16 md:py-24 bg-slate-800/50">
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-serif font-bold text-foreground mb-8"
          >
            {language === "en" ? (
              <>
                Past <span className="text-cyan-400">Papers</span>
              </>
            ) : (
              "கடந்த கால வினாத்தாள்கள்"
            )}
          </motion.h2>

          <div className="max-w-4xl mx-auto">
            {pastPapersLoading ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">
                  {language === "en"
                    ? "Loading past papers..."
                    : "கடந்த கால வினாத்தாள்களை ஏற்றுகிறது..."}
                </div>
              </div>
            ) : pastPapers.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">
                  {language === "en"
                    ? "No past papers available"
                    : "கடந்த கால வினாத்தாள்கள் கிடைக்கவில்லை"}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {pastPaperYears.map((year) => {
                  const isOpen = openPastPaperYear === year;
                  const yearPapers = pastPapersByYear.get(year) || [];

                  return (
                    <div
                      key={year}
                      className="bg-cyan-500/20 backdrop-blur-sm rounded-xl border border-cyan-500/40"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setOpenPastPaperYear((current) =>
                            current === year ? null : year
                          )
                        }
                        className="w-full flex items-center justify-between p-5 hover:border-cyan-500/60 hover:bg-cyan-500/30 transition-all duration-300"
                      >
                        <div className="flex items-center gap-4">
                          <FileText className="w-7 h-7 text-secondary" />
                          <h3 className="text-xl font-semibold text-foreground">
                            {year}
                          </h3>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {isOpen ? "Hide" : "View"}
                        </span>
                      </button>

                      {isOpen ? (
                        <div className="space-y-4 p-5 pt-0">
                          {yearPapers.map((paper) => (
                            <motion.div
                              key={paper.pp_id}
                              initial={{ opacity: 0, y: 20 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }}
                              className="flex items-center justify-between p-6 bg-cyan-500/10 backdrop-blur-sm rounded-xl border border-cyan-500/30 hover:border-cyan-500/60 hover:bg-cyan-500/20 transition-all duration-300"
                            >
                              <div className="flex items-center gap-4">
                                <FileText className="w-8 h-8 text-secondary" />
                                <div>
                                  <h3 className="text-xl font-semibold text-foreground">
                                    {paper.subject ||
                                      (language === "en"
                                        ? "Past Paper"
                                        : "…r…rY…r\"…_?…r …r…r_…rý …ræ…r¨…rc…r_…r…_?…r…r_…r3…_?")}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(
                                      paper.created_at
                                    ).toLocaleDateString(
                                      language === "en" ? "en-US" : "ta-LK",
                                      {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                      }
                                    )}
                                  </p>
                                </div>
                              </div>

                              <div className="flex gap-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    openDownload(paper, "paper", false)
                                  }
                                  disabled={!paper.exam_paper_path}
                                  className="flex items-center gap-2"
                                >
                                  <Download className="w-4 h-4" />
                                  {language === "en"
                                    ? "Paper"
                                    : "…r…r_…r3…_?"}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    openDownload(paper, "scheme", false)
                                  }
                                  disabled={!paper.scheme_path}
                                  className="flex items-center gap-2"
                                >
                                  <Download className="w-4 h-4" />
                                  {language === "en"
                                    ? "Scheme"
                                    : "…r…r¨…rY…_?…rY…rr…_?"}
                                </Button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
                              </div>
            )}
          </div>
        </div>
      </section>

      {/* Seminar Resources */}
      <section ref={seminarRef} className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-serif font-bold text-foreground mb-8"
          >
            {language === "en" ? (
              <>
                Seminar <span className="text-cyan-400">Resources</span>
              </>
            ) : (
              "செமினார் வளங்கள்"
            )}
          </motion.h2>

          <div className="max-w-4xl mx-auto">
            {seminarsLoading ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">
                  {language === "en"
                    ? "Loading seminars..."
                    : "செமினார்களை ஏற்றுகிறது..."}
                </div>
              </div>
            ) : seminars.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">
                  {language === "en"
                    ? "No seminars available"
                    : "செமினார்கள் கிடைக்கவில்லை"}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {seminarYears.map((year) => {
                  const isOpen = openSeminarYear === year;
                  const yearSeminars = seminarsByYear.get(year) || [];

                  return (
                    <div
                      key={year}
                      className="bg-cyan-500/20 backdrop-blur-sm rounded-xl border border-cyan-500/40"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setOpenSeminarYear((current) =>
                            current === year ? null : year
                          )
                        }
                        className="w-full flex items-center justify-between p-5 hover:border-cyan-500/60 hover:bg-cyan-500/30 transition-all duration-300"
                      >
                        <div className="flex items-center gap-4">
                          <FileText className="w-7 h-7 text-secondary" />
                          <h3 className="text-xl font-semibold text-foreground">
                            {year}
                          </h3>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {isOpen ? "Hide" : "View"}
                        </span>
                      </button>

                      {isOpen ? (
                        <div className="space-y-4 p-5 pt-0">
                          {yearSeminars.map((seminar) => (
                            <motion.div
                              key={seminar.sem_id}
                              initial={{ opacity: 0, y: 20 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }}
                              className="flex items-center justify-between p-6 bg-cyan-500/10 backdrop-blur-sm rounded-xl border border-cyan-500/30 hover:border-cyan-500/60 hover:bg-cyan-500/20 transition-all duration-300"
                            >
                              <div className="flex items-center gap-4">
                                <FileText className="w-8 h-8 text-secondary" />
                                <div>
                                  <h3 className="text-xl font-semibold text-foreground">
                                    {language === "en"
                                      ? `Seminar ${seminar.yrs}`
                                      : `${seminar.yrs} …rs…_+…rr…r¨…rc…r_…rø…_?`}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(
                                      seminar.created_at
                                    ).toLocaleDateString(
                                      language === "en" ? "en-US" : "ta-LK",
                                      {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                      }
                                    )}
                                  </p>
                                </div>
                              </div>

                              <div className="flex gap-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    openDownload(seminar, "paper", true)
                                  }
                                  disabled={!seminar.seminar_paper_path}
                                  className="flex items-center gap-2"
                                >
                                  <Download className="w-4 h-4" />
                                  {language === "en"
                                    ? "Paper"
                                    : "…r…r_…r3…_?"}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    openDownload(seminar, "answers", true)
                                  }
                                  disabled={!seminar.answers_path}
                                  className="flex items-center gap-2"
                                >
                                  <Download className="w-4 h-4" />
                                  {language === "en"
                                    ? "Answers"
                                    : "…r¦…r…r¨…rý…_?…r…r3…_?"}
                                </Button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
                              </div>
            )}
          </div>
        </div>
      </section>

      
    </div>
  );
};

export default ResourcesPage;
