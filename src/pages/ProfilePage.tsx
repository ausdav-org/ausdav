import React from 'react';
import { motion } from 'framer-motion';
import {
  User,
  AtSign,
  IdCard,
  Users,
  GraduationCap,
  School,
  Phone,
  Mail,
  BadgeCheck,
  Building2,
  ArrowLeft,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

/** ✅ SVG overlay ONLY (no background fill) so it matches your site's container background */
const SpaceOverlay: React.FC<{ opacity?: number }> = ({ opacity = 0.35 }) => {
  // deterministic stars (no Math.random in render)
  const stars = [
    [8, 18, 0.12, 0.6],
    [15, 42, 0.08, 0.5],
    [22, 28, 0.10, 0.7],
    [32, 12, 0.06, 0.5],
    [44, 26, 0.09, 0.6],
    [58, 18, 0.07, 0.55],
    [66, 32, 0.10, 0.65],
    [74, 14, 0.06, 0.5],
    [82, 22, 0.12, 0.6],
    [90, 40, 0.08, 0.55],
    [12, 72, 0.10, 0.5],
    [28, 86, 0.07, 0.45],
    [46, 78, 0.09, 0.55],
    [62, 88, 0.06, 0.5],
    [78, 74, 0.10, 0.55],
    [92, 86, 0.08, 0.45],
  ];

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ opacity }}
    >
      <defs>
        <radialGradient id="topGlow" cx="50%" cy="0%" r="70%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
          <stop offset="55%" stopColor="#38bdf8" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>

        {/* corner accent */}
        <radialGradient id="cornerGlow" cx="0%" cy="30%" r="50%">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ONLY glows, background stays transparent */}
      <rect x="0" y="0" width="100" height="100" fill="url(#topGlow)" />
      <rect x="0" y="0" width="100" height="100" fill="url(#cornerGlow)" />

      {/* stars */}
      {stars.map(([cx, cy, r, o], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="white" opacity={o} />
      ))}
    </svg>
  );
};

const ProfilePage: React.FC = () => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // ✅ your data unchanged
  const profile = {
    photo: '/ausdav/src/assets/Committee/2022/Ruthu.jpg',
    fullName: 'Ruththiragayan Sutharsan',
    username: '@ruththraa2003',
    nic: '200311400232',
    gender: language === 'en' ? 'Male' : 'ஆண்',
    role: language === 'en' ? 'Media Head' : 'ஊடக தலைவர்',
    batch: '2025',
    university: language === 'en' ? 'University of Moratuwa' : 'மொரட்டுவ பல்கலைக்கழகம்',
    school: 'V/Maththiriya M.V.',
    phone: '+94 77 112 3456',
    designation: language === 'en' ? 'AUSDAV Executive Committee' : 'AUSDAV நிர்வாக குழு',
    email: 'ruththu2003@gmail.com',
  };

  const labels = {
    title: language === 'en' ? 'Profile' : 'சுயவிவரம்',
    fullName: language === 'en' ? 'Full Name' : 'முழுப் பெயர்',
    username: language === 'en' ? 'Username' : 'பயனர்பெயர்',
    nic: language === 'en' ? 'NIC No' : 'அடையாள எண்',
    gender: language === 'en' ? 'Gender' : 'பாலினம்',
    role: language === 'en' ? 'Role' : 'பங்கு',
    batch: language === 'en' ? 'Batch' : 'தொகுதி',
    university: language === 'en' ? 'University' : 'பல்கலைக்கழகம்',
    school: language === 'en' ? 'School' : 'பள்ளி',
    phone: language === 'en' ? 'Phone' : 'தொலைபேசி',
    designation: language === 'en' ? 'Designation' : 'பதவி',
    email: language === 'en' ? 'Email' : 'மின்னஞ்சல்',
  };

  const textMain = isDark ? 'text-white' : 'text-foreground';
  const textSub = isDark ? 'text-white/70' : 'text-muted-foreground';

  const rows = [
    { icon: IdCard, label: labels.nic, value: profile.nic },
    { icon: Users, label: labels.gender, value: profile.gender },
    { icon: BadgeCheck, label: labels.role, value: profile.role },
    { icon: GraduationCap, label: labels.batch, value: profile.batch },
    { icon: Building2, label: labels.university, value: profile.university },
    { icon: School, label: labels.school, value: profile.school },
    { icon: Phone, label: labels.phone, value: profile.phone },
    { icon: Mail, label: labels.email, value: profile.email },
  ];

  return (
    // ✅ IMPORTANT: no background color/image here -> inherits your site layout background
    <div className="min-h-screen relative">
      {/* subtle overlay only */}
      <SpaceOverlay opacity={isDark ? 0.35 : 0.18} />

      <div className="container mx-auto px-4 py-12 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <div className="flex items-center gap-3 mb-6">
            <button
              type="button"
              onClick={() => window.history.back()}
              className={cn(
                'h-10 w-10 rounded-full flex items-center justify-center border backdrop-blur-md transition',
                isDark
                  ? 'bg-white/5 border-white/15 hover:bg-white/10'
                  : 'bg-white/70 border-border/60 hover:bg-white'
              )}
              aria-label="Back"
            >
              <ArrowLeft className={cn('w-5 h-5', textMain)} />
            </button>

            <div>
              <h1 className={cn('text-3xl md:text-4xl font-serif font-bold', textMain)}>
                {labels.title}
              </h1>
              <p className={cn('text-sm mt-1', textSub)}>
                {language === 'en'
                  ? 'Professional profile details'
                  : 'தொழில்முறை சுயவிவர விவரங்கள்'}
              </p>
            </div>
          </div>

          {/* your existing card/content unchanged */}
          <div
            className={cn(
              'rounded-2xl border backdrop-blur-md shadow-xl p-6 md:p-8',
              isDark ? 'bg-white/5 border-white/15' : 'bg-white/70 border-border/60'
            )}
          >
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <div className="w-28 h-28 rounded-full p-[2px] bg-gradient-to-br from-cyan-400/70 via-sky-500/70 to-indigo-500/70 shadow">
                  <img
                    src={profile.photo}
                    alt={profile.fullName}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <div className="absolute -inset-3 rounded-full blur-2xl bg-cyan-500/20" />
              </div>

              <h2 className={cn('mt-5 text-2xl md:text-3xl font-serif font-bold', textMain)}>
                {profile.fullName}
              </h2>

              <div className={cn('mt-1 flex items-center gap-2', textSub)}>
                <AtSign className="w-4 h-4" />
                <span className="font-medium">{profile.username}</span>
              </div>

              <div
                className={cn(
                  'mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full border',
                  isDark ? 'border-white/15 bg-white/5' : 'border-border/60 bg-muted/40'
                )}
              >
                <User className={cn('w-4 h-4', isDark ? 'text-cyan-200' : 'text-primary')} />
                <span className={cn('text-sm font-semibold', textMain)}>{profile.designation}</span>
              </div>
            </div>

            <div className={cn('my-7 h-px w-full', isDark ? 'bg-white/10' : 'bg-border/60')} />

            <div className="grid sm:grid-cols-2 gap-4">
              {rows.map((r, i) => (
                <motion.div
                  key={r.label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    'rounded-xl border p-4 flex items-start gap-3 transition',
                    isDark
                      ? 'bg-white/5 border-white/10 hover:border-white/20'
                      : 'bg-white/60 border-border/60 hover:bg-white'
                  )}
                >
                  <div
                    className={cn(
                      'h-10 w-10 rounded-lg flex items-center justify-center border',
                      isDark ? 'bg-white/5 border-white/10' : 'bg-muted/40 border-border/60'
                    )}
                  >
                    <r.icon className={cn('w-5 h-5', isDark ? 'text-cyan-200' : 'text-primary')} />
                  </div>

                  <div className="min-w-0">
                    <p className={cn('text-xs font-semibold uppercase tracking-wide', textSub)}>
                      {r.label}
                    </p>
                    <p className={cn('mt-1 font-medium break-words', textMain)}>{r.value}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-6 flex justify-center">
              <div
                className={cn(
                  'px-4 py-2 rounded-full border text-sm font-semibold',
                  isDark
                    ? 'bg-gradient-to-r from-cyan-300/15 to-indigo-400/15 border-white/10 text-white/90'
                    : 'bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border-border/60 text-foreground'
                )}
              >
                {language === 'en' ? 'AUSDAV Member Profile' : 'AUSDAV உறுப்பினர் சுயவிவரம்'}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
