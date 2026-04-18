import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Client for general use (respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
  },
  db: {
    url: supabaseUrl.endsWith('/') ? supabaseUrl.slice(0, -1) : supabaseUrl
  }
})

// Client for administrative use (bypasses RLS)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: { 
        url: supabaseUrl.endsWith('/') ? supabaseUrl.slice(0, -1) : supabaseUrl 
      }
    })
  : null;

if (typeof window === 'undefined' && supabaseAdmin) {
  console.log('[Supabase] Admin client initialized for:', supabaseUrl);
}
