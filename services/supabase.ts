import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient<Database> | null = null;

if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your_supabase_project_url' && supabaseAnonKey !== 'your_supabase_anon_key') {
  try {
    supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
  }
} else {
  console.warn('Supabase credentials not found. Using localStorage fallback.');
}

// Fallback: null이면 localStorage 모드로 작동
export const supabaseClient = supabase;

// Legacy export for backward compatibility
export const supabase = supabaseClient || ({} as SupabaseClient<Database>);

export const isSupabaseConfigured = () => {
  return supabaseClient !== null;
};

