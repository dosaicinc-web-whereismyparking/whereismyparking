import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Custom fetch to strip /rest/v1 for installations without Kong
const supabaseFetch: typeof fetch = (url, options) => {
  if (url.toString().includes('/rest/v1/')) {
    const newUrl = url.toString().replace('/rest/v1/', '/');
    return fetch(newUrl, options);
  }
  return fetch(url, options);
};

// Client for general use (respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
  },
  global: {
    fetch: supabaseFetch
  }
});

// Client for administrative use (bypasses RLS)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        fetch: supabaseFetch
      }
    })
  : null;



// Manually override the auth URL for standalone GoTrue (no-Kong setup)
// Both the admin client and the regular client need this so that server-side
// auth.getUser(token) calls reach GoTrue (port 9999) not PostgREST (port 54321).
if (supabaseAdmin) {
  const authUrl = process.env.SUPABASE_AUTH_URL || 'http://127.0.0.1:9999';
  (supabaseAdmin.auth as any).url = authUrl;
}

// Override for the regular client (server-side only)
if (typeof window === 'undefined') {
  const authUrl = process.env.SUPABASE_AUTH_URL || 'http://127.0.0.1:9999';
  (supabase.auth as any).url = authUrl;
}

if (typeof window === 'undefined' && supabaseAdmin) {
  console.log('[Supabase] Admin client initialized for:', supabaseUrl);
}
