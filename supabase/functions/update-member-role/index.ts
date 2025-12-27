// @ts-ignore - Deno remote imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: { env: { get(key: string): string | undefined } };

serve(async (req: Request) => {
  const origin = req.headers.get('origin') || '*';
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
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

  let payload: { mem_ids?: number[]; new_role?: string };
  try {
    payload = await req.json();
  } catch (_err) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const memIds = payload?.mem_ids;
  const newRole = payload?.new_role;
  if (!Array.isArray(memIds) || memIds.length === 0 || !newRole) {
    return new Response(JSON.stringify({ error: 'Missing mem_ids array or new_role' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
      .select('mem_id, role')
      .eq('auth_user_id', userId)
      .maybeSingle();

    if (memberErr) throw memberErr;
    if (!memberRow) return new Response(JSON.stringify({ error: 'Forbidden: not an admin' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const callerRole = memberRow.role;
    const callerMemId = memberRow.mem_id;

    // Fetch target rows early for subsequent checks
    const { data: targets, error: targetsErr } = await adminClient
      .from('members')
      .select('mem_id, role')
      .in('mem_id', memIds as number[]);
    if (targetsErr) throw targetsErr;

    // Count existing super_admins
    const { data: superAdmins, error: saErr } = await adminClient
      .from('members')
      .select('mem_id')
      .eq('role', 'super_admin');
    if (saErr) throw saErr;
    const totalSuper = (superAdmins || []).length;

    console.log('update-member-role called by', userId, 'callerRole=', callerRole, 'callerMemId=', callerMemId, 'memIds=', memIds, 'newRole=', newRole, 'totalSuper=', totalSuper);

    // Prevent non-super_admins from promoting to admin/super_admin
    if ((newRole === 'admin' || newRole === 'super_admin') && callerRole !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Only super admins can promote to admin or super_admin' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Enforce at most 2 super_admins: if promoting targets to super_admin, ensure limit
    if (newRole === 'super_admin') {
      const toPromote = (targets || []).filter((t: any) => t.role !== 'super_admin').length;
      if (totalSuper + toPromote > 2) {
        return new Response(JSON.stringify({ error: 'Cannot have more than 2 super_admins' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Prevent the last remaining super_admin from downgrading themselves
    if (callerRole === 'super_admin' && memIds.includes(callerMemId) && newRole !== 'super_admin' && totalSuper <= 1) {
      return new Response(JSON.stringify({ error: 'Cannot change role: would remove the last super_admin' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // If caller is admin (not super_admin), ensure targets are not admins/super_admins (no downgrades)
    if (callerRole !== 'super_admin') {
      if (callerRole !== 'admin') {
        return new Response(JSON.stringify({ error: 'Forbidden: admin only' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const protectedTarget = (targets || []).find((t: any) => t.role === 'admin' || t.role === 'super_admin');
      if (protectedTarget) {
        return new Response(JSON.stringify({ error: 'Admins may not change roles of admin/super_admin users' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Perform update using a security-definer RPC which sets a session flag
    // that the trigger respects. This avoids the trigger raising 'forbidden'.
    const { data: updated, error: updErr } = await adminClient.rpc('set_member_roles', {
      p_ids: memIds,
      p_role: newRole,
    }) as any;
    if (updErr) throw updErr;

    return new Response(JSON.stringify({ updated: updated ?? [] }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('Update-member-role failed', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Update failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
