import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'
// Custom fetch to strip /rest/v1 for installations without Kong
const supabaseFetch: typeof fetch = (url, options) => {
  if (url.toString().includes('/rest/v1/')) {
    const newUrl = url.toString().replace('/rest/v1/', '/');
    return fetch(newUrl, options);
  }
  return fetch(url, options);
};

/**
 * Lazily create Supabase clients so that importing this module at build time
 * (during `next build`) does NOT throw when env vars are absent.
 * Env vars are only required at runtime when the client is actually used.
 */
function createSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  let client;
  if (typeof window !== 'undefined') {
    // Use the client-side createBrowserClient
    client = createBrowserClient(url, key, {
      global: { fetch: supabaseFetch },
    });
  } else {
    client = createClient(url, key, {
      auth: { persistSession: false },
      global: { fetch: supabaseFetch },
    });
  }
  // Override auth URL for standalone GoTrue (no-Kong)
  if (typeof window === 'undefined') {
    const authUrl = process.env.SUPABASE_AUTH_URL || 'http://127.0.0.1:9999';
    (client.auth as any).url = authUrl;
  }
  return client;
}

function createSupabaseAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  const client = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: supabaseFetch },
  });
  // Override auth URL for standalone GoTrue (no-Kong)
  const authUrl = process.env.SUPABASE_AUTH_URL || 'http://127.0.0.1:9999';
  (client.auth as any).url = authUrl;
  if (typeof window === 'undefined') {
    console.log('[Supabase] Admin client initialized for:', url);
  }
  return client;
}

// Singleton instances — created on first import at runtime, not at build time.
let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null | undefined = undefined;

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_supabase) _supabase = createSupabaseClient();
    return (_supabase as any)[prop];
  },
});

export function getSupabaseAdmin(): SupabaseClient | null {
  if (_supabaseAdmin === undefined) _supabaseAdmin = createSupabaseAdminClient();
  return _supabaseAdmin;
}

// Keep backward compat export — will be null if service key not set
export const supabaseAdmin: SupabaseClient | null = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const admin = getSupabaseAdmin();
    if (!admin) return undefined;
    return (admin as any)[prop];
  },
}) as unknown as SupabaseClient | null;
