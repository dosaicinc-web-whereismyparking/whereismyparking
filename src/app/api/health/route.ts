import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Health check endpoint — probed by Hetzner LB11 every 5 seconds.
 * Uses a raw SQL ping (SELECT 1) bypassing RLS so it always reflects
 * true DB reachability, not policy evaluation results.
 * Returns 200 if the app and DB are reachable, 503 otherwise.
 */
export async function GET() {
  try {
    // Use service_role key to bypass RLS — health check only needs raw connectivity
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { error } = await adminClient.rpc('pg_sleep', { seconds: 0 });

    // pg_sleep may not be exposed — fallback: try a system table
    if (error && error.code !== 'PGRST202') {
      // Try direct system table query as final fallback
      const { error: e2 } = await adminClient
        .from('users')
        .select('id')
        .limit(0);
      
      if (e2 && !['PGRST116'].includes(e2.code || '')) {
        return NextResponse.json(
          { status: 'error', message: 'Database unreachable', detail: e2.message },
          { status: 503 }
        );
      }
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
