import { supabase } from './supabase';

/**
 * Check if the current session is valid and has not expired (30-day policy)
 */
export async function checkSession() {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    return { authenticated: false };
  }

  // Supabase JWTs have their own 'exp' claim.
  // If we want a strict 30-day logout from login time regardless of activity:
  // We can check the 'iat' (issued at) claim.
  const payload = JSON.parse(atob(session.access_token.split('.')[1]));
  const issuedAt = payload.iat * 1000;
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  if (Date.now() - issuedAt > thirtyDaysMs) {
    console.warn('[Auth] Session older than 30 days, logging out');
    await supabase.auth.signOut();
    return { authenticated: false, reason: 'Session expired (30-day policy)' };
  }

  return { authenticated: true, session, user: session.user };
}

/**
 * Helper to get user role (admin/user)
 */
export async function getUserRole() {
  const { authenticated, user } = await checkSession();
  if (!authenticated || !user) return 'guest';

  const { data: adminData } = await supabase
    .from('admin_users')
    .select('userId')
    .eq('userId', user.id)
    .maybeSingle();

  return adminData ? 'admin' : 'user';
}
