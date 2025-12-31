import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

type Lang = 'en' | 'ta';
type Member = {
  id: string | number;
  role: string;
  roleTA: string;
  name: string;
  nameTA: string;
  Work: string;
  WorkTA?: string;
  photo: string | null;
  linkedin: string | null;
};

// Map database designation enum to display roles
const DESIGNATION_TO_ROLE: Record<string, { en: string; ta: string }> = {
  president: { en: 'President', ta: 'தலைவர்' },
  vice_president: { en: 'Vice President', ta: 'துணைத் தலைவர்' },
  secretary: { en: 'Secretary', ta: 'செயலாளர்' },
  vice_secretary: { en: 'Vice Secretary', ta: 'துணைச் செயலாளர்' },
  treasurer: { en: 'Treasurer', ta: 'பொருளாளர்' },
  assistant_treasurer: { en: 'Vice Treasurer', ta: 'துணைப் பொருளாளர்' },
   editor: { en: 'Editor', ta: 'ஊடக தலைவர்' },
   web_designer: { en: 'Web Developer', ta: 'இணைய நிர்வாகி' },
  general_committee_member: { en: 'General', ta: 'பொது' },
  education_committee_member: { en: 'Education', ta: 'கல்வி' },
  university_representative: { en: 'Representative', ta: 'பல்கலை பிரதிநிதி' },
};

const TITLES = {
  patrons: { en: 'Patrons Of AUSDAV', ta: 'AUSDAV ஆதரவாளர்கள்' },
  exec: { en: 'Executive Committee', ta: 'நிர்வாக குழு' },
  reps: { en: 'Representative', ta: 'பல்கலை பிரதிநிதிகள்' },
  edu: { en: 'Education', ta: 'கல்வி' },
  gen: { en: 'General', ta: 'பொது' },
};

// Executive committee designations
const EXEC_DESIGNATIONS = [
  'president',
  'vice_president',
  'secretary',
  'vice_secretary',
  'treasurer',
  'assistant_treasurer',
  'editor',
  'web_designer',
];

type MemberRow = {
  mem_id: number;
  fullname: string;
  designation: string | null;
  batch: number;
  university: string;
  uni_degree: string | null;
  profile_bucket: string;
  profile_path: string | null;
};

const IconLI = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M20.447 20.452H17.21v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.078V9h3.112v1.561h.044c.434-.823 1.494-1.692 3.073-1.692 3.287 0 3.894 2.164 3.894 4.977v6.606zM5.337 7.433a1.814 1.814 0 110-3.628 1.814 1.814 0 010 3.628zM6.956 20.452H3.716V9h3.24v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.727v20.545C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.273V1.727C24 .774 23.2 0 22.222 0z" />
  </svg>
);

const IconUser = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z" />
  </svg>
);


const Card = ({ m, i, lang, isDark }) => {
  const [imgOk, setImgOk] = useState(!!m.photo);
  const name = lang === 'en' ? m.name : m.nameTA;
  const role = lang === 'en' ? m.role : m.roleTA;

  
  return (
    <motion.div
      key={m.id}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: i * 0.15 }} // Keep the 'i' for staggered animation
      whileHover={{ y: -10 }}
      // THE COPIED TEMPLATE CLASSES BELOW:
      className="bg-cyan-500/20 backdrop-blur-sm rounded-2xl p-8 border border-cyan-500/40 hover:border-cyan-500/60 hover:bg-cyan-500/30 transition-all duration-300 text-center"
    >
      {/* The Cyan Box for Photo/Initial */}
      <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-cyan-400 flex items-center justify-center overflow-hidden">
        {imgOk && m.photo ? (
          <img 
            src={m.photo} 
            className="w-full h-full object-cover" 
            onError={() => setImgOk(false)} 
          />
        ) : (
          <span className="text-3xl font-bold text-slate-900">
            {name.charAt(0)}
          </span>
        )}
      </div>

      {/* The Text Content */}
      <h3 className="font-bold text-xl mb-1 text-white">
        {name}
      </h3>
      <p className="text-cyan-400 font-medium mb-2">
        {role}
      </p>
      <p className="text-sm text-slate-400">
        {m.Work}
      </p>
    </motion.div>
  );
};


const Section = ({ 
  title, 
  sub, 
  members, 
  lang, 
  isDark 
}: { 
  title: string; 
  sub?: string; 
  members: any[]; 
  lang: string;
  isDark: boolean;
}) => {
  if (!members || members.length === 0) return null;

  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-4">
        {/* HEADER AREA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16 space-y-4"
        >
          {/* THE PILL SHAPE HEADER (Matches your image) */}
          <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full border border-cyan-500/30 bg-slate-800/40 backdrop-blur-md shadow-[0_0_20px_rgba(34,211,238,0.1)]">
            {/* The Glowing Cyan Dot */}
            <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.8)] animate-pulse" />
            
            <h2 className="text-xl md:text-2xl font-bold tracking-wide text-white">
              {title}
            </h2>
          </div>

          {/* SUBTITLE (The smaller text below the title) */}
          {sub && (
            <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto italic">
              {sub}
            </p>
          )}
        </motion.div>

        {/* GRID AREA (The container for your cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {members.map((m, i) => (
            <Card key={m.id || i} m={m} i={i} lang={lang} isDark={isDark} />
          ))}
        </div>
      </div>
    </section>
  );
};


type Block = { tEn: string; tTa: string; sEn?: string; sTa?: string; members: Member[]; cols?: string; gradient?: boolean };
type Page = { year: number; blocks: Block[] };

const CommitteePage: React.FC = () => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const lang: Lang = language === 'ta' ? 'ta' : 'en';

  // Fetch patrons from DB
  type PatronRow = {
    id: string | number;
    name: string;
    designation?: string | null;
    image_paths?: string[] | null;
    display_order?: number | null;
    is_active?: boolean | null;
    image_alt?: string | null;
    linkedin_id?: string | null;
  };

  const { data: patronsRows } = useQuery<PatronRow[]>({
    queryKey: ['patrons', 'public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patrons' as any)
        .select('id, name, designation, image_paths, display_order, is_active, image_alt, linkedin_id')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as PatronRow[];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Fetch members from DB with designations
  const { data: membersRows, isLoading: membersLoading, error: membersError } = useQuery<MemberRow[]>({
    queryKey: ['committee-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('mem_id, fullname, designation, batch, university, uni_degree, profile_bucket, profile_path')
        .not('designation', 'is', null)
        .neq('designation', 'none')
        .neq('designation', '')
        .order('batch', { ascending: false })
        .order('fullname', { ascending: true });
      if (error) {
        console.error('Error fetching committee members:', error);
        throw error;
      }
      return (data ?? []) as unknown as MemberRow[];
    },
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  // Map patrons to Member format
  const patronsMembers: Member[] = (patronsRows ?? []).map((p: PatronRow) => {
    const imgPath = Array.isArray(p.image_paths) && p.image_paths.length > 0 && p.image_paths[0] ? p.image_paths[0] : null;
    const publicUrl = imgPath
      ? supabase.storage.from('patrons').getPublicUrl(imgPath).data?.publicUrl ?? null
      : null;
    return {
      id: p.id,
      role: 'Patron',
      roleTA: 'ஆதரவாளர்',
      name: p.name,
      nameTA: p.name,
      Work: p.designation || '',
      photo: publicUrl,
      linkedin: p.linkedin_id || null,
    } as Member;
  });

  // Map database members to Member format and organize by batch
  const membersByBatch = useMemo(() => {
    if (!membersRows) return new Map<number, MemberRow[]>();

    const grouped = new Map<number, MemberRow[]>();
    for (const member of membersRows) {
      const batch = member.batch;
      if (!grouped.has(batch)) {
        grouped.set(batch, []);
      }
      grouped.get(batch)!.push(member);
    }
    return grouped;
  }, [membersRows]);

  // Convert member row to Member format
  const mapMemberRowToMember = (row: MemberRow, lang: Lang): Member => {
    const designation = row.designation || '';
    const roleInfo = DESIGNATION_TO_ROLE[designation] || { en: designation, ta: designation };
    const role = lang === 'en' ? roleInfo.en : roleInfo.ta;
    const roleTA = lang === 'ta' ? roleInfo.ta : roleInfo.en;

    // Build work string from uni_degree and university
    const workParts: string[] = [];
    if (row.uni_degree) workParts.push(row.uni_degree);
    if (row.university) workParts.push(row.university);
    const work = workParts.join(',');

    // Get photo URL if profile_path exists
    let photo: string | null = null;
    if (row.profile_path && row.profile_bucket) {
      const { data } = supabase.storage.from(row.profile_bucket).getPublicUrl(row.profile_path);
      photo = data?.publicUrl || null;
    }

    return {
      id: row.mem_id,
      role: roleInfo.en,
      roleTA: roleInfo.ta,
      name: row.fullname,
      nameTA: row.fullname,
      Work: work,
      photo,
      linkedin: null, // LinkedIn not stored in members table currently
    };
  };

  // Create pages dynamically from database data
  const pages: Page[] = useMemo(() => {
    if (!membersByBatch.size) return [];

    const sortedBatches = Array.from(membersByBatch.keys()).sort((a, b) => b - a);
    return sortedBatches.map((batch) => {
      const members = membersByBatch.get(batch) || [];
      
      // Sort members by designation priority before organizing
      const designationOrder: Record<string, number> = {
        president: 1,
        vice_president: 2,
        secretary: 3,
        vice_secretary: 4,
        treasurer: 5,
        assistant_treasurer: 6,
        editor: 7,
        web_designer: 8,
        university_representative: 9,
        education_committee_member: 10,
        general_committee_member: 11,
      };
      const sortedMembers = [...members].sort((a, b) => {
        const aDes = a.designation || '';
        const bDes = b.designation || '';
        const orderDiff = (designationOrder[aDes] || 99) - (designationOrder[bDes] || 99);
        if (orderDiff !== 0) return orderDiff;
        return a.fullname.localeCompare(b.fullname);
      });

      const execMembers: Member[] = [];
      const repMembers: Member[] = [];
      const eduMembers: Member[] = [];
      const genMembers: Member[] = [];

      for (const memberRow of sortedMembers) {
        const designation = memberRow.designation || '';
        const member = mapMemberRowToMember(memberRow, lang);

        if (EXEC_DESIGNATIONS.includes(designation)) {
          execMembers.push(member);
        } else if (designation === 'university_representative') {
          member.role = memberRow.university;
          member.roleTA = memberRow.university;
          repMembers.push(member);
        } else if (designation === 'education_committee_member') {
          eduMembers.push(member);
        } else if (designation === 'general_committee_member') {
          genMembers.push(member);
        }
      }

      const blocks: Block[] = [
        {
          tEn: TITLES.patrons.en,
          tTa: TITLES.patrons.ta,
          sEn: 'Meet the dedicated team guiding AUSDAV',
          sTa: 'AUSDAV ஐ வழிநடத்தும் அர்ப்பணிப்பு குழுவை சந்திக்கவும்',
          members: patronsMembers,
        },
      ];

      if (execMembers.length > 0) blocks.push({ tEn: TITLES.exec.en, tTa: TITLES.exec.ta, members: execMembers });
      if (repMembers.length > 0) blocks.push({ tEn: TITLES.reps.en, tTa: TITLES.reps.ta, members: repMembers });
      if (eduMembers.length > 0) blocks.push({ tEn: TITLES.edu.en, tTa: TITLES.edu.ta, members: eduMembers });
      if (genMembers.length > 0) blocks.push({ tEn: TITLES.gen.en, tTa: TITLES.gen.ta, members: genMembers });

      return { year: batch, blocks };
    });
  }, [membersByBatch, lang, patronsMembers]);

  const [idx, setIdx] = useState(0);
  const cur = pages[idx] || pages[0];

  const bgStyle = {
    background: isDark
      ? `radial-gradient(circle at 0% 0%, rgba(34, 211, 238, 0.08) 0%, transparent 50%),
         radial-gradient(circle at 100% 100%, rgba(34, 211, 238, 0.08) 0%, transparent 50%),
         linear-gradient(180deg, #020617 0%, #0f172a 50%, #020617 100%)`
      : 'linear-gradient(180deg, #ecfeff 0%, #eff6ff 40%, #ffffff 100%)',
  };

  const YearBtn = ({ active, children, onClick }: { active?: boolean; children: React.ReactNode; onClick: () => void }) => (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      whileHover={{ y: -2 }}
      className={cn(
        'h-10 px-4 rounded-full font-semibold transition outline-none border backdrop-blur-md',
        active
          ? 'bg-gradient-to-r from-cyan-300/90 to-indigo-400/90 text-black border-transparent'
          : isDark
            ? 'bg-white/5 text-white border-white/10 hover:bg-white/10'
            : 'bg-card/70 text-foreground border-border/60 hover:bg-card'
      )}
      aria-current={active ? 'page' : undefined}
    >
      {children}
    </motion.button>
  );

  const NextBtn = ({ disabled, onClick }: { disabled: boolean; onClick: () => void }) => (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.96 }}
      whileHover={!disabled ? { y: -2 } : undefined}
      className={cn(
        'h-10 px-5 rounded-full font-semibold transition flex items-center gap-2 outline-none border backdrop-blur-md',
        disabled
          ? isDark
            ? 'bg-white/5 text-white/40 border-white/10 cursor-not-allowed'
            : 'bg-muted text-muted-foreground border-border/60 cursor-not-allowed'
          : 'bg-gradient-to-r from-rose-500/90 to-orange-400/90 text-black border-transparent hover:brightness-110'
      )}
    >
      Next <span aria-hidden="true">›</span>
    </motion.button>
  );

  const isLoading = membersLoading;
  const hasError = membersError;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={bgStyle}>
        <p className={cn('text-lg', isDark ? 'text-white' : 'text-foreground')}>Loading committee data...</p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={bgStyle}>
        <div className="text-center">
          <p className={cn('text-lg mb-2', isDark ? 'text-red-400' : 'text-red-600')}>
            Error loading committee data
          </p>
          <p className={cn('text-sm', isDark ? 'text-white/70' : 'text-muted-foreground')}>
            {hasError instanceof Error ? hasError.message : 'Please try again later'}
          </p>
        </div>
      </div>
    );
  }

  if (!cur || pages.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={bgStyle}>
        <p className={cn('text-lg', isDark ? 'text-white/70' : 'text-muted-foreground')}>
          No committee data available
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={bgStyle}>
      {/* HOME PAGE GLOW EFFECTS */}
      <div className="absolute top-0 -left-20 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      {cur?.blocks.map((b, bi) => (
        <Section
          key={`${cur.year}-${bi}`}
          title={lang === 'en' ? b.tEn : b.tTa}
          sub={lang === 'en' ? b.sEn : b.sTa}
          members={b.members}
          lang={lang}
          isDark={isDark}
        />
      ))}

      <div className="flex items-center justify-center gap-2 pb-14">
        {pages.map((p, i) => (
          <YearBtn key={p.year} active={i === idx} onClick={() => setIdx(i)}>
            {p.year}
          </YearBtn>
        ))}
        <NextBtn disabled={idx === pages.length - 1} onClick={() => setIdx((v) => Math.min(v + 1, pages.length - 1))} />
      </div>
    </div>
  );
};

export default CommitteePage;
