import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'member' | 'honourable' | 'admin' | 'super_admin';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  batch: string | null;
  avatar_url: string | null;
  is_active: boolean;
  can_submit_finance: boolean;
  mfa_enabled: boolean;
}

interface AdminAuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string, email?: string | null, meta?: Record<string, any>) => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData as Profile);
      } else {
        // Self-heal: if auth user exists but profile row doesn't, create one (first-run or partial setup)
        const { count: profilesCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        const isFirstProfile = (profilesCount ?? 0) === 0;
        const fullNameGuess =
          (meta?.full_name as string | undefined) ||
          (meta?.name as string | undefined) ||
          (email ? email.split('@')[0] : undefined) ||
          'User';

        const { data: createdProfile } = await supabase
          .from('profiles')
          .insert({
            user_id: userId,
            email: email ?? '',
            full_name: fullNameGuess,
            phone: null,
            batch: null,
            avatar_url: null,
            is_active: isFirstProfile,
            can_submit_finance: isFirstProfile,
            mfa_enabled: false,
          })
          .select('*')
          .maybeSingle();

        if (createdProfile) {
          setProfile(createdProfile as Profile);
        }
      }

      // Fetch role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleData) {
        setRole(roleData.role as AppRole);
      } else {
        // Self-heal: create a default role if missing.
        const { count: rolesCount } = await supabase
          .from('user_roles')
          .select('*', { count: 'exact', head: true });

        const isFirstRole = (rolesCount ?? 0) === 0;
        const roleToAssign: AppRole = isFirstRole ? 'super_admin' : 'member';

        const { data: createdRole } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: roleToAssign })
          .select('role')
          .maybeSingle();

        if (createdRole) {
          setRole(createdRole.role as AppRole);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserData(user.id, user.email, user.user_metadata as Record<string, any>);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer Supabase calls with setTimeout
          setTimeout(() => {
            fetchUserData(session.user.id, session.user.email, session.user.user_metadata as Record<string, any>);
          }, 0);
        } else {
          setProfile(null);
          setRole(null);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id, session.user.email, session.user.user_metadata as Record<string, any>);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
  };

  const isAdmin = role === 'admin' || role === 'super_admin';
  const isSuperAdmin = role === 'super_admin';

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        loading,
        isAdmin,
        isSuperAdmin,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
