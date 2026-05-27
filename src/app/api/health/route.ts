import { NextResponse } from 'next/server';

/**
 * Health check endpoint — probed by Hetzner LB11 every 5 seconds.
 * Uses a raw HTTP GET to the PostgREST root (no Supabase client, no RLS)
 * to verify database connectivity without any policy evaluation.
 * Returns 200 if reachable, 503 otherwise.
 */
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_INTERNAL_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { status: 'error', message: 'Missing env vars' },
        { status: 503 }
      );
    }

    // Raw fetch to PostgREST /users with service_role — no client lib, no path rewriting
    // In this no-Kong setup, PostgREST serves directly at the root (no /rest/v1 prefix)
    const res = await fetch(`${supabaseUrl}/users?select=id&limit=0`, {
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
      },
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) {
      const body = await res.text();
      return NextResponse.json(
        { status: 'error', message: `DB returned ${res.status}`, detail: body.substring(0, 200) },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { status: 'ok', timestamp: Date.now() },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { status: 'error', message: String(err) },
      { status: 503 }
    );
  }
}
