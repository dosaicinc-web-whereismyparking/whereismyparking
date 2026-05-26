import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Health check endpoint — probed by Hetzner LB11 every 5 seconds.
 * Returns 200 if the app and DB are reachable, 503 otherwise.
 * The load balancer removes this node from rotation on non-200.
 */
export async function GET() {
  try {
    // Lightweight DB ping — just checks connectivity, not query performance
    const { error } = await supabase
      .from('parking_listings')
      .select('id')
      .limit(1);

    if (error) {
      return NextResponse.json(
        { status: 'error', message: 'Database unreachable', detail: error.message },
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
