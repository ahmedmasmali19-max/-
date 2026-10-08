import { createClient } from '@supabase/supabase-js';

export const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const db = configured ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {auth:{persistSession:true,autoRefreshToken:true}}) : null;

export const tables = {
  beneficiaries:{title:'المستفيدون'},
  vehicles:{title:'المركبات'},
  contracts:{title:'العقود'},
  installments:{title:'الأقساط والتحصيل'},
  maintenance:{title:'التأمين والصيانة'},
  followups:{title:'المتابعات'}
} as const;
export type TableName = keyof typeof tables;
