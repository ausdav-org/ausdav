import { supabase } from '@/integrations/supabase/client';

type InvokeResult = { data: any | null; error: any | null };

/**
 * Invoke a Supabase Edge Function with a fetch-based fallback for environments
 * where `supabase.functions.invoke` may fail (network/host resolution issues).
 */
export async function invokeFunction(name: string, body: any): Promise<InvokeResult> {
  try {
    const res = await supabase.functions.invoke(name, { body });
    // supabase-js returns { data, error }
    if ((res as any).error) return { data: (res as any).data ?? null, error: (res as any).error };
    return { data: (res as any).data ?? null, error: null };
  } catch (err) {
    // Fallback: call the function endpoint directly
    try {
      const base = import.meta.env.VITE_SUPABASE_URL;
      const anon = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      if (!base) throw err;
      const url = `${base.replace(/\/$/, '')}/functions/v1/${name}`;
      const r = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(anon ? { apikey: anon } : {}),
        },
        body: JSON.stringify(body),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) return { data, error: new Error(data?.error || r.statusText) };
      return { data, error: null };
    } catch (e) {
      return { data: null, error: e };
    }
  }
}

export default invokeFunction;
