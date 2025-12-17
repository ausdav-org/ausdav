import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, Eye, EyeOff, ArrowLeft, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const LoginPage: React.FC = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if already logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        redirectBasedOnRole(session.user.id);
      }
    };
    checkSession();
  }, []);

  const redirectBasedOnRole = async (userId: string) => {
    try {
      // Fetch user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      // Fetch profile for activation status
      const { data: profileData } = await supabase
        .from('profiles')
        .select('is_active')
        .eq('user_id', userId)
        .maybeSingle();

      const role = roleData?.role;
      const isActive = profileData?.is_active ?? false;

      if (!isActive && role !== 'super_admin') {
        setError(language === 'en' 
          ? 'Your account is not yet activated. Please contact an administrator.'
          : 'உங்கள் கணக்கு இன்னும் செயல்படுத்தப்படவில்லை. நிர்வாகியைத் தொடர்பு கொள்ளவும்.');
        await supabase.auth.signOut();
        return;
      }

      // Redirect based on role
      switch (role) {
        case 'super_admin':
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'member':
        case 'honourable':
          navigate('/admin/profile');
          break;
        default:
          navigate('/admin/profile');
      }
    } catch (err) {
      console.error('Error checking role:', err);
      navigate('/admin/profile');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate form
    const validation = loginSchema.safeParse(form);
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError(language === 'en' 
            ? 'Invalid email or password' 
            : 'தவறான மின்னஞ்சல் அல்லது கடவுச்சொல்');
        } else {
          setError(signInError.message);
        }
        return;
      }

      if (data.user) {
        toast.success(language === 'en' ? 'Login successful!' : 'உள்நுழைவு வெற்றி!');
        await redirectBasedOnRole(data.user.id);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12">
      {/* Background effects */}
      <div
        className="absolute inset-0 opacity-30"
        style={{ backgroundImage: 'var(--gradient-hero)' }}
      />
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md px-4 relative z-10"
      >
        <div className="glass-card rounded-2xl p-8 border border-border/50">
          {/* Back link */}
          <Link 
            to="/" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {language === 'en' ? 'Back to Home' : 'முகப்புக்குத் திரும்பு'}
          </Link>

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center neon-glow">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              {language === 'en' ? 'Member Login' : 'உறுப்பினர் உள்நுழைவு'}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {language === 'en' 
                ? 'Sign in to access your dashboard' 
                : 'உங்கள் டாஷ்போர்டை அணுக உள்நுழையவும்'}
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {language === 'en' ? 'Email' : 'மின்னஞ்சல்'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="pl-10 bg-background/50"
                  placeholder="member@ausdav.org"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {language === 'en' ? 'Password' : 'கடவுச்சொல்'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="pl-10 pr-10 bg-background/50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  {language === 'en' ? 'Signing in...' : 'உள்நுழைகிறது...'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  {language === 'en' ? 'Sign In' : 'உள்நுழை'}
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border/30">
            <p className="text-center text-sm text-muted-foreground">
              {language === 'en' 
                ? 'Only registered members can access the portal.' 
                : 'பதிவு செய்யப்பட்ட உறுப்பினர்கள் மட்டுமே போர்டலை அணுக முடியும்.'}
            </p>
            <p className="text-center text-xs text-muted-foreground mt-2">
              {language === 'en' 
                ? 'Contact admin if you need access' 
                : 'அணுகல் தேவைப்பட்டால் நிர்வாகியைத் தொடர்பு கொள்ளவும்'}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
