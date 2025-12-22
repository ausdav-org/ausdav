import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Fail fast if env vars are missing to avoid creating a broken client in production.
if (!url || !anonKey) {
  throw new Error('Supabase configuration is missing. Check VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
}

// Guard storage for SSR/test environments where localStorage is undefined.
const storage = typeof window !== 'undefined' ? localStorage : undefined;

export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    storage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'ausdav.supabase.auth',
  },
  global: {
    headers: { 'X-Client-Info': 'ausdav-web' },
  },
});