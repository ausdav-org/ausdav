import { supabase } from '@/integrations/supabase/client';

export type OrgContact = {
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  bank_name?: string | null;
  account_name?: string | null;
  account_number?: string | null;
  branch?: string | null;
  is_enabled?: boolean | null;
};

export async function fetchOrgContact(): Promise<OrgContact | null> {
  const res: any = await (supabase as any)
    .from('org_contact_settings')
    .select('phone,email,address,bank_name,account_name,account_number,branch,is_enabled')
    .eq('id', 1)
    .maybeSingle();

  if (res?.error) throw res.error;
  return res?.data ?? null;
}
