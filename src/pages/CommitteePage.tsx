import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

import presidentImg from '@/assets/Committee/2022/piri.jpg';
import vicep_presidentImg from '@/assets/Committee/2022/janu.jpg';
import SecretaryImg from '@/assets/Committee/2022/Thiso.jpg';
import vice_secretaryImg from '@/assets/Committee/2022/mohana.jpg';
import treasurerImg from '@/assets/Committee/2022/saruka.jpg';
import vice_treasurerImg from '@/assets/Committee/2022/sangavi.jpg';
import mediaheadImg from '@/assets/Committee/2022/Ruthu.jpg';
import webhandlerImg from '@/assets/Committee/2022/Thaya.jpg';
import rep_uni2 from '@/assets/Committee/2022/seraja.jpg';
import rep_uni3 from '@/assets/Committee/2022/sathu.jpg';
import rep_uni4 from '@/assets/Committee/2022/pavithra.jpg';
import rep_uni6 from '@/assets/Committee/2022/tharani.jpg';
import rep_uni7 from '@/assets/Committee/2022/janushka.jpg';
import rep_uni8 from '@/assets/Committee/2022/thani.jpg';

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

const ROLE_TA: Record<string, string> = {
  Advisor: 'ஆலோசகர்',
  'Co-Advisor': 'உப ஆலோசகர்',
  Patron: 'ஆதரவாளர்',
  Coordinator: 'ஒருங்கிணைப்பாளர்',
  President: 'தலைவர்',
  'Vice President': 'துணைத் தலைவர்',
  Secretary: 'செயலாளர்',
  'Vice Secretary': 'துணைச் செயலாளர்',
  Treasurer: 'பொருளாளர்',
  'Vice Treasurer': 'துணைப் பொருளாளர்',
  'Media Head': 'ஊடக தலைவர்',
  'Web Handler': 'இணைய நிர்வாகி',
  Representative: 'பல்கலை பிரதிநிதி',
  Education: 'கல்வி',
  General: 'பொது',
};

const TITLES = {
  patrons: { en: 'Patrons Of AUSDAV', ta: 'AUSDAV ஆதரவாளர்கள்' },
  exec: { en: 'Executive Committee', ta: 'நிர்வாக குழு' },
  reps: { en: 'Representative', ta: 'பல்கலை பிரதிநிதிகள்' },
  edu: { en: 'Education', ta: 'கல்வி' },
  gen: { en: 'General', ta: 'பொது' },
};

const data = {
  top: [] as Member[],

  y2025_exec: [
    { id: 2501, role: 'President', roleTA: ROLE_TA.President, name: 'Piriyatharsan M.', nameTA: 'Piriyatharsan M.', Work: 'BSc Eng. (Hons) (Reading),Electrical Engineering,University of Moratuwa', photo: presidentImg, linkedin: 'https://www.linkedin.com/in/maharajah-piriyatharsan-618202344/' },
    { id: 2502, role: 'Vice President', roleTA: ROLE_TA['Vice President'], name: 'Januraj J.', nameTA: 'Januraj J.', Work: 'BSc Eng. (Hons) (Reading),Mechanical Engineering,University of Moratuwa', photo: vicep_presidentImg, linkedin: 'https://www.linkedin.com/in/janu-rajah-69a3392b9/' },
    { id: 2503, role: 'Secretary', roleTA: ROLE_TA.Secretary, name: 'Thisoraj A.', nameTA: 'Thisoraj A.', Work: 'BSc Eng. (Hons) (Reading),Electrical Engineering,University of Ruhuna', photo: SecretaryImg, linkedin: 'https://www.linkedin.com/in/arasaratnam-thisoraj-70b89a336/' },
    { id: 2504, role: 'Vice Secretary', roleTA: ROLE_TA['Vice Secretary'], name: 'Mohanapratha K.', nameTA: 'Mohanapratha K.', Work: 'MBBS(Reading),University of Colombo', photo: vice_secretaryImg, linkedin: null },
    { id: 2505, role: 'Treasurer', roleTA: ROLE_TA.Treasurer, name: 'Saruka U.', nameTA: 'Saruka U.', Work: 'BSc Eng. (Hons) (Reading),Electronic & Telecommunication Engineering,University of Moratuwa', photo: treasurerImg, linkedin: 'https://www.linkedin.com/in/saruka-umainesan-a55490345/' },
    { id: 2506, role: 'Vice Treasurer', roleTA: ROLE_TA['Vice Treasurer'], name: 'Sangavi S.', nameTA: 'Sangavi S.', Work: '2022', photo: vice_treasurerImg, linkedin: 'https://www.linkedin.com/in/sangavi' },
    { id: 2507, role: 'Media Head', roleTA: ROLE_TA['Media Head'], name: 'Ruththiragayan S.', nameTA: 'Ruththiragayan S.', Work: 'BSc Eng. (Hons) (Reading),Computer Science & Engineering,University of Moratuwa', photo: mediaheadImg, linkedin: 'https://www.linkedin.com/in/ruththiragayan-sutharsan-179356343/' },
    { id: 2508, role: 'Web Handler', roleTA: ROLE_TA['Web Handler'], name: 'Thayarathan V.', nameTA: 'Thayarathan V.', Work: 'BSc Eng. (Hons) (Reading),Mechanical Engineering,University of Moratuwa', photo: webhandlerImg, linkedin: 'https://www.linkedin.com/in/thayarathan' },
  ] as Member[],

  y2025_reps: [
    { id: 2509, role: 'University of Moratuwa', roleTA: ROLE_TA.Representative, name: 'Nishanth N.', nameTA: 'Nishanth N', Work: 'BSc Eng. (Hons) (Reading),Chemical and Process Engineering,University of Moratuwa', photo: null, linkedin: null },
    { id: 2510, role: 'University of Colombo', roleTA: ROLE_TA.Representative, name: 'Serajah A.', nameTA: 'Serajah A.', Work: 'MBBS(Reading),University of Colombo', photo: rep_uni2, linkedin: null },
    { id: 2511, role: 'University of Peradeniya', roleTA: ROLE_TA.Representative, name: 'Sathushan S.', nameTA: 'Sathushan S.', Work: 'MBBS(Reading),University of Peradeniya', photo: rep_uni3, linkedin: null },
    { id: 2512, role: 'University of Jpura', roleTA: ROLE_TA.Representative, name: 'Pavithra M.', nameTA: 'Pavithra M.', Work: 'Bachelor of Science (Hons) in Optometry(Reading)', photo: rep_uni4, linkedin: null },
    { id: 2513, role: 'University of Jaffna', roleTA: ROLE_TA.Representative, name: 'Sivalaxshan J.', nameTA: 'Sivalaxshan J', Work: 'MBBS(Reading),University of Jaffna', photo: null, linkedin: null },
    { id: 2514, role: 'University of Ruhuna Representative', roleTA: ROLE_TA.Representative, name: 'Tharaniyan S.', nameTA: 'Tharaniyan S.', Work: 'BSc Eng. (Hons) (Reading),Computer Engineering,University of Ruhuna', photo: rep_uni6, linkedin: null },
    { id: 2515, role: 'South Eastern University Representative', roleTA: ROLE_TA.Representative, name: 'Janushka S.', nameTA: 'Janushka S.', Work: 'BSc Eng. (Hons) (Reading),Civil Engineering,University of South Eastern', photo: rep_uni7, linkedin: null },
    { id: 2516, role: 'University of Kelaniya Representative', roleTA: ROLE_TA.Representative, name: 'Thanikayan R.', nameTA: 'Thanikayan R.', Work: '2022', photo: rep_uni8, linkedin: null },
    { id: 2517, role: 'University of Sabragamuwa', roleTA: ROLE_TA.Representative, name: 'Harol Maxilan P.', nameTA: 'Harol Maxilan P.', Work: '2025', photo: null, linkedin: null },
  ] as Member[],

  y2025_education: Array.from({ length: 4 }, (_, i) => ({
    id: 5201 + i,
    role: 'Education',
    roleTA: ROLE_TA.Education,
    name: `Education Member 0${i + 1}`,
    nameTA: `கல்வி உறுப்பினர் 0${i + 1}`,
    Work: '2025',
    photo: null,
    linkedin: null,
  })) as Member[],

  y2025_general: Array.from({ length: 4 }, (_, i) => ({
    id: 5301 + i,
    role: 'General',
    roleTA: ROLE_TA.General,
    name: `General Member 0${i + 1}`,
    nameTA: `பொது உறுப்பினர் 0${i + 1}`,
    Work: '2025',
    photo: null,
    linkedin: null,
  })) as Member[],

  // (keep your remaining years unchanged...)
  y2024_exec: [
    { id: 2401, role: 'President', roleTA: ROLE_TA.President, name: 'Ketharan S.', nameTA: '2024 தலைவர்', Work: 'Work 1,Work 2,Work 3', photo: null, linkedin: null },
    { id: 2402, role: 'Vice President', roleTA: ROLE_TA['Vice President'], name: 'Pranavy S.', nameTA: '2024 துணைத் தலைவர்', Work: 'MBBS(Reading),University of Jaffna', photo: null, linkedin: null },
    { id: 2403, role: 'Secretary', roleTA: ROLE_TA.Secretary, name: 'Gajaananan S.', nameTA: '2024 செயலாளர்', Work: 'Work 1,Work 2,Work 3', photo: null, linkedin: null },
    { id: 2404, role: 'Vice Secretary', roleTA: ROLE_TA['Vice Secretary'], name: 'Sanjilraj A.', nameTA: '2024 துணைச் செயலாளர்', Work: 'Work 1,Work 2,Work 3', photo: null, linkedin: null },
    { id: 2405, role: 'Treasurer', roleTA: ROLE_TA.Treasurer, name: 'Sulojan R.', nameTA: '2024 பொருளாளர்', Work: 'BSc Eng. (Hons) (Reading),Electronic & Telecommunication Engineering,University of Moratuwa', photo: null, linkedin: null },
    { id: 2406, role: 'Vice Treasurer', roleTA: ROLE_TA['Vice Treasurer'], name: 'Arulnesasarma P.', nameTA: '2024 துணைப் பொருளாளர்', Work: 'MBBS(Reading),University of Colombo', photo: null, linkedin: null },
    { id: 2407, role: 'Media Head', roleTA: ROLE_TA['Media Head'], name: 'Jathees S.', nameTA: '2024 ஊடக தலைவர்', Work: 'BSc Eng. (Hons) (Reading),Mechanical Engineering,University of Moratuwa', photo: null, linkedin: null },
    { id: 2408, role: 'Web Handler', roleTA: ROLE_TA['Web Handler'], name: 'John Praveen V.', nameTA: '2024 இணைய நிர்வாகி', Work: 'BSc Eng. (Hons) (Reading),Electronic & Telecommunication Engineering,University of Moratuwa', photo: null, linkedin: null },
  ] as Member[],
  y2024_reps: [
    { id: 2409, role: 'University of Moratuwa', roleTA: ROLE_TA.Representative, name: 'Dayananthan T.', nameTA: 'Dayananthan T.', Work: '', photo: null, linkedin: null },
    { id: 2410, role: 'University of Colombo', roleTA: ROLE_TA.Representative, name: 'Shahana S.', nameTA: 'Shahana S.', Work: 'MBBS(Reading),University of Colombo', photo: null, linkedin: null },
    { id: 2411, role: 'University of Peradeniya', roleTA: ROLE_TA.Representative, name: 'Mathumithan R.', nameTA: 'Mathumithan R.', Work: 'MBBS(Reading),University of Peradeniya', photo: null, linkedin: null },
    { id: 2412, role: 'University of Jpura', roleTA: ROLE_TA.Representative, name: 'Kishanth S.', nameTA: 'Kishanth S.', Work: '2021', photo: null, linkedin: null },
    { id: 2413, role: 'University of Jaffna', roleTA: ROLE_TA.Representative, name: 'Thanikaibalan K.', nameTA: 'Thanikaibalan K.', Work: '2021', photo: null, linkedin: null },
    { id: 2414, role: 'University of Ruhuna', roleTA: ROLE_TA.Representative, name: 'Thamotharan T.', nameTA: 'Thamotharan T.', Work: '2021', photo: null, linkedin: null },
  ] as Member[],
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

const Card = ({
  m,
  i,
  lang,
  isDark,
}: {
  m: Member;
  i: number;
  lang: Lang;
  isDark: boolean;
}) => {
  const name = lang === 'en' ? m.name : m.nameTA;
  const role = lang === 'en' ? m.role : m.roleTA;
  const work = (lang === 'en' ? m.Work : m.WorkTA ?? m.Work).split(',');

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ delay: i * 0.04, duration: 0.5, ease: 'easeOut' }}
      whileHover={{ y: -6, scale: 1.01 }}
      className={cn(
        'relative rounded-2xl p-6 text-center border backdrop-blur-md transition',
        isDark
          ? 'border-white/10 bg-white/5 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.8)] hover:border-white/20'
          : 'border-border/60 bg-card/70 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.18)] hover:border-border'
      )}
    >
      {m.linkedin && (
        <a
          href={m.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition shadow',
            isDark ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-muted text-foreground hover:bg-muted/80'
          )}
          aria-label="LinkedIn Profile"
        >
          <IconLI />
        </a>
      )}

      {m.photo ? (
        <div className="w-24 h-24 mx-auto mb-4 rounded-full p-[2px] bg-gradient-to-br from-cyan-400/70 via-sky-500/70 to-indigo-500/70 shadow">
          <img src={m.photo} alt={m.role === 'Patron' ? '' : name} className="w-full h-full rounded-full object-cover" loading="lazy" />
        </div>
      ) : (
        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-400/70 to-indigo-500/70 flex items-center justify-center shadow">
          <div
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center',
              isDark ? 'bg-white/10 text-white' : 'bg-white/20 text-black'
            )}
          >
            <IconUser />
          </div>
        </div>
      )}

      <h3 className={cn('font-serif font-semibold text-lg tracking-wide', isDark ? 'text-white' : 'text-foreground')}>
        {name.toUpperCase()}
      </h3>
      <p className={cn('font-medium text-sm mt-1', isDark ? 'text-cyan-200/90' : 'text-primary')}>
        {role}
      </p>

      <p className={cn('text-sm mt-2 leading-relaxed', isDark ? 'text-white/70' : 'text-muted-foreground')}>
        {work.map((t, idx) => (
          <React.Fragment key={idx}>
            {t.trim()}
            {idx < work.length - 1 && <br />}
          </React.Fragment>
        ))}
      </p>
    </motion.div>
  );
};

const Section = ({
  title,
  sub,
  members,
  cols = 'grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
  gradient = true,
  lang,
  isDark,
}: {
  title: string;
  sub?: string;
  members: Member[];
  cols?: string;
  gradient?: boolean;
  lang: Lang;
  isDark: boolean;
}) => {
  if (!members.length) return null;

  return (
    <>
      <section
        className={gradient ? 'py-14 md:py-20' : 'py-10'}
        style={
          gradient
            ? {
                background:
                  'radial-gradient(900px 300px at 50% 0%, rgba(34,211,238,.18), transparent 60%), radial-gradient(900px 300px at 50% 100%, rgba(99,102,241,.16), transparent 65%)',
              }
            : undefined
        }
      >
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
          >
            <div
              className={cn(
                'inline-flex items-center gap-3 px-5 py-2 rounded-full border backdrop-blur-md shadow',
                isDark ? 'border-white/10 bg-white/5' : 'border-border/60 bg-card/70'
              )}
            >
              <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,.8)]" />
              <h2 className={cn('text-3xl md:text-4xl font-serif font-bold', isDark ? 'text-white' : 'text-foreground')}>
                {title}
              </h2>
            </div>
            {sub && (
              <p className={cn('mt-4 text-base md:text-lg', isDark ? 'text-white/70' : 'text-muted-foreground')}>
                {sub}
              </p>
            )}
          </motion.div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className={cols}>
            {members.map((m, i) => (
              <Card key={m.id} m={m} i={i} lang={lang} isDark={isDark} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

type Block = { tEn: string; tTa: string; sEn?: string; sTa?: string; members: Member[]; cols?: string; gradient?: boolean };
type Page = { year: number; blocks: Block[] };

const CommitteePage: React.FC = () => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const lang: Lang = language === 'ta' ? 'ta' : 'en';

  const pages: Page[] = useMemo(
    () => [
      {
        year: 2025,
        blocks: [
          // `patrons` block will be replaced by live DB results below
          { tEn: TITLES.patrons.en, tTa: TITLES.patrons.ta, sEn: 'Meet the dedicated team guiding AUSDAV', sTa: 'AUSDAV ஐ வழிநடத்தும் அர்ப்பணிப்பு குழுவை சந்திக்கவும்', members: data.top, cols: 'grid sm:grid-cols-2 lg:grid-cols-4 gap-6', gradient: true },
          { tEn: TITLES.exec.en, tTa: TITLES.exec.ta, members: data.y2025_exec, gradient: true },
          { tEn: TITLES.reps.en, tTa: TITLES.reps.ta, members: data.y2025_reps, gradient: true },
          { tEn: TITLES.edu.en, tTa: TITLES.edu.ta, members: data.y2025_education, gradient: true },
          { tEn: TITLES.gen.en, tTa: TITLES.gen.ta, members: data.y2025_general, gradient: true },
        ],
      },
      { year: 2024, blocks: [{ tEn: TITLES.exec.en, tTa: TITLES.exec.ta, members: data.y2024_exec, gradient: true }, { tEn: TITLES.reps.en, tTa: TITLES.reps.ta, members: data.y2024_reps, gradient: true }] },
    ],
    []
  );

  const [idx, setIdx] = useState(0);
  const cur = pages[idx];

  // Fetch patrons from DB and map to Member shape
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

  const patronsMembers: Member[] = (patronsRows ?? []).map((p: PatronRow, i: number) => {
    const imgPath = Array.isArray(p.image_paths) && p.image_paths.length > 0 && p.image_paths[0] ? p.image_paths[0] : null;
    // Only get publicUrl if there's a valid path; otherwise set photo to null so placeholder shows
    const publicUrl = imgPath
      ? supabase.storage.from('patrons').getPublicUrl(imgPath).data?.publicUrl ?? null
      : null;
    return {
      id: p.id,
      role: 'Patron',
      roleTA: ROLE_TA.Patron,
      name: p.name,
      nameTA: p.name,
      Work: p.designation || '',
      photo: publicUrl,
      linkedin: p.linkedin_id || null,
    } as Member;
  });

  const bgStyle = useMemo(
    () => ({
      background: isDark
        ? 'linear-gradient(180deg, #050914 0%, #070B18 40%, #050812 100%)'
        : 'linear-gradient(180deg, rgba(236,254,255,1) 0%, rgba(239,246,255,1) 40%, rgba(255,255,255,1) 100%)',
    }),
    [isDark]
  );

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

  return (
    <div className="min-h-screen" style={bgStyle}>
      {cur.blocks.map((b, bi) => {
        const membersForBlock = b.tEn === TITLES.patrons.en ? (patronsMembers.length ? patronsMembers : b.members) : b.members;
        return (
          <React.Fragment key={`${cur.year}-${bi}`}>
            <Section
              title={lang === 'en' ? b.tEn : b.tTa}
              sub={lang === 'en' ? b.sEn : b.sTa}
              members={membersForBlock}
              cols={b.cols}
              gradient={b.gradient}
              lang={lang}
              isDark={isDark}
            />
          </React.Fragment>
        );
      })}

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
