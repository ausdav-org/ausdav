// @ts-ignore - Deno remote imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: { env: { get(key: string): string | undefined } };

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Service misconfigured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Authenticate caller
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const { data: userData, error: userErr } = await adminClient.auth.getUser(token as string) as any;
    if (userErr) throw userErr;
    const userId = userData?.user?.id;
    if (!userId) return new Response(JSON.stringify({ error: 'Cannot identify user' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Ensure caller is an admin or super_admin by checking members table
    const { data: callerRow, error: callerErr } = await adminClient
      .from('members')
      .select('mem_id, role')
      .eq('auth_user_id', userId)
      .maybeSingle();
    if (callerErr) throw callerErr;
    if (!callerRow) return new Response(JSON.stringify({ error: 'Forbidden: not an admin' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const callerRole = callerRow.role;
    if (!['admin','super_admin'].includes(callerRole)) {
      return new Response(JSON.stringify({ error: 'Forbidden: insufficient role' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fetch all members using service role (bypasses RLS) and return
    const { data: membersData, error: membersErr } = await adminClient
      .from('members')
      .select('mem_id, auth_user_id, fullname, username, phone, batch, created_at, role, designation')
      .order('created_at', { ascending: false });
    if (membersErr) throw membersErr;

    return new Response(JSON.stringify({ members: membersData ?? [] }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('fetch-members failed', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Fetch failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
