import { supabase } from '@/integrations/supabase/client';

type InvokeResult = { data: any | null; error: any | null };

/**
 * Invoke a Supabase Edge Function with a fetch-based fallback for environments
 * where `supabase.functions.invoke` may fail (network/host resolution issues).
 */
export async function invokeFunction(name: string, body: any): Promise<InvokeResult> {
  try {
    // Use a direct fetch to the Edge Function endpoint so we can guarantee
    // forwarding of both the anon `apikey` and the current session
    // `Authorization: Bearer <token>` header. Some environments or versions
    // of supabase-js do not reliably forward custom headers via
    // `supabase.functions.invoke`.
    const base = import.meta.env.VITE_SUPABASE_URL;
    const anon = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!base) throw new Error('Missing VITE_SUPABASE_URL');

    let authHeader: Record<string, string> = {};
    try {
      const s = await supabase.auth.getSession();
      const token = s?.data?.session?.access_token;
      if (token) authHeader = { Authorization: `Bearer ${token}` };
    } catch (_e) {
      // ignore
    }

    const url = `${base.replace(/\/$/, '')}/functions/v1/${name}`;
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(anon ? { apikey: anon } : {}),
        ...authHeader,
      },
      body: JSON.stringify(body),
    });

    const text = await r.text().catch(() => '');
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (_e) { data = text; }
    if (!r.ok) {
      const message = data?.error || (typeof data === 'string' ? data : r.statusText);
      const error = new Error(`Edge function ${name} returned ${r.status}: ${message}`);
      console.error('invokeFunction fetch error', { name, url, status: r.status, body: data });
      return { data, error };
    }

    return { data, error: null };
  } catch (err) {
    // Fallback: call the function endpoint directly and surface detailed errors
    try {
      const base = import.meta.env.VITE_SUPABASE_URL;
      const anon = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      if (!base) throw err;
      const url = `${base.replace(/\/$/, '')}/functions/v1/${name}`;

      // Include the current session access token so Edge Functions can
      // authenticate the caller (falls back to anon key if not available).
      let authHeader: Record<string, string> = {};
      try {
        const s = await supabase.auth.getSession();
        const token = s?.data?.session?.access_token;
        if (token) authHeader = { Authorization: `Bearer ${token}` };
      } catch (_e) {
        // ignore
      }

      const r = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(anon ? { apikey: anon } : {}),
          ...authHeader,
        },
        body: JSON.stringify(body),
      });

      const text = await r.text().catch(() => '');
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (_e) {
        data = text;
      }

      if (!r.ok) {
        const message = data?.error || (typeof data === 'string' ? data : r.statusText);
        const error = new Error(`Edge function ${name} returned ${r.status}: ${message}`);
        console.error('invokeFunction fallback error', { name, url, status: r.status, body: data, originalErr: err });
        return { data, error };
      }

      return { data, error: null };
    } catch (e) {
      console.error('invokeFunction failed', { name, originalErr: err, fallbackErr: e });

      // Build a combined error message with as much context as we can extract.
      const origMsg = err instanceof Error ? err.message : JSON.stringify(err);
      const fbMsg = e instanceof Error ? e.message : JSON.stringify(e);
      const combined = new Error(`invokeFunction: primary error: ${origMsg}; fallback error: ${fbMsg}`);
      return { data: null, error: combined };
    }
  }
}

export default invokeFunction;
