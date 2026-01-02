import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;
let supabaseAdminInstance: SupabaseClient | null = null;

export function getSupabase() {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    // Only create client on browser side
    if (typeof window === 'undefined') {
      throw new Error('Supabase client can only be used on the client side');
    }

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      }
    });
  }
  return supabaseInstance;
}

export function getSupabaseAdmin() {
  if (!supabaseAdminInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    supabaseAdminInstance = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return supabaseAdminInstance;
}

// Database types
export type Outfit = {
  id: string;
  user_id: string;
  image_url: string;
  style_tags: string[];
  colors: string[];
  description: string;
  categories: string[];
  embedding: number[];
  created_at: string;
  updated_at: string;
};

export type Item = {
  id: string;
  brand: string;
  name: string;
  category: string;
  price_range: string;
  image_url: string;
  description: string;
  embedding: number[];
  created_at: string;
};

export type SavedItem = {
  id: string;
  user_id: string;
  outfit_id: string;
  item_id: string;
  created_at: string;
};
