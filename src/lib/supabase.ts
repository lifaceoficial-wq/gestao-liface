import { createClient } from '@supabase/supabase-js';

// @ts-ignore
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sua-url-do-supabase.supabase.co';
// @ts-ignore
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sua-chave-anon-do-supabase';

export const isSupabaseConfigured = supabaseUrl !== 'https://sua-url-do-supabase.supabase.co';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
