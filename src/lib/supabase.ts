import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  const isUrlValid =
    typeof supabaseUrl === 'string' &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('your-project-id');

  // Supabase REST/PostgREST membutuhkan anon key berformat JWT (diawali dengan 'eyJ')
  const isKeyValid =
    typeof supabaseAnonKey === 'string' &&
    supabaseAnonKey.startsWith('eyJ');

  return isUrlValid && isKeyValid;
};

let clientInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) return null;
  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return clientInstance;
};

export const supabase = isSupabaseConfigured() ? getSupabase() : null;
