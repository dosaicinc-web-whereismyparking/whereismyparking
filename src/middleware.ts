import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') || 
                          request.nextUrl.pathname.startsWith('/listings/new');
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');

  // 1. Basic Auth Check
  if ((isProtectedRoute || isAdminRoute) && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. 30-Day Policy Logic (optional but good for strict security)
  // Note: Supabase handling of refresh tokens usually manages this, 
  // but if the user specifically asked for '30-day token expiry':
  // we check the session if available.
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    const payload = JSON.parse(atob(session.access_token.split('.')[1]));
    const issuedAt = payload.iat * 1000;
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    if (Date.now() - issuedAt > thirtyDaysMs) {
      const redirectRes = NextResponse.redirect(new URL('/login?reason=session_expired', request.url));
      // Sign out to clear server-side session state
      await supabase.auth.signOut();
      return redirectRes;
    }
  }

  // 3. Admin Check
  if (isAdminRoute && user) {
    const { data: adminCheck } = await supabase
      .from('admin_users')
      .select('userId')
      .eq('userId', user.id)
      .maybeSingle();

    if (!adminCheck) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
