import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Subscription lifecycle driver.
 *
 * Transitions ACTIVE → GRACE_PERIOD → EXPIRED (and hides lapsed listings) by
 * invoking the idempotent `expire_subscriptions()` RPC. Intended to be called
 * on a schedule by an external cron / uptime pinger when pg_cron is not
 * available on the self-hosted Postgres node.
 *
 * Protected by a shared secret so it cannot be triggered anonymously:
 *   Authorization: Bearer ${CRON_SECRET}
 */
async function runExpiry() {
  const secretConfigured = process.env.CRON_SECRET;
  if (!secretConfigured) {
    return NextResponse.json(
      { error: 'CRON_SECRET is not configured' },
      { status: 500 }
    );
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Admin client not initialized' }, { status: 500 });
  }

  const { data, error } = await supabaseAdmin.rpc('expire_subscriptions');

  if (error) {
    console.error('[Cron] expire_subscriptions failed:', error);
    return NextResponse.json({ error: 'Expiry run failed', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, result: data });
}

function authorize(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get('Authorization');
  return header === `Bearer ${secret}`;
}

export async function POST(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return runExpiry();
}

// Allow GET for cron services that only issue GETs; same secret requirement.
export async function GET(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return runExpiry();
}
