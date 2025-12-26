// @ts-ignore - Deno remote imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: { env: { get(key: string): string | undefined } };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Service misconfigured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let payload: { mem_ids?: number[] };
  try {
    payload = await req.json();
  } catch (_err) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const memIds = payload?.mem_ids;
  if (!Array.isArray(memIds) || memIds.length === 0) {
    return new Response(JSON.stringify({ error: 'Missing mem_ids array' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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

    const { data: memberRow, error: memberErr } = await adminClient
      .from('members')
      .select('role')
      .eq('auth_user_id', userId)
      .maybeSingle();

    if (memberErr) throw memberErr;
    if (!memberRow) return new Response(JSON.stringify({ error: 'Forbidden: not an admin' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const callerRole = memberRow.role;

    // If caller is admin (not super_admin), ensure targets are only role='member'
    if (callerRole !== 'super_admin') {
      if (callerRole !== 'admin') {
        return new Response(JSON.stringify({ error: 'Forbidden: admin only' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const { data: targets, error: tErr } = await adminClient
        .from('members')
        .select('mem_id,role')
        .in('mem_id', memIds as number[]);
      if (tErr) throw tErr;
      const invalid = (targets || []).find((t: any) => t.role !== 'member');
      if (invalid) {
        return new Response(JSON.stringify({ error: 'Admins may only delete members with role=member' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Perform deletion using service role
    const { data: deleted, error: delErr } = await adminClient.from('members').delete().in('mem_id', memIds).select('mem_id');
    if (delErr) throw delErr;

    return new Response(JSON.stringify({ deleted: deleted ?? [] }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('Delete-members failed', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Delete failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
