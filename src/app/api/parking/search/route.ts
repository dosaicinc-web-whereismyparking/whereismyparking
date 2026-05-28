import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_INTERNAL_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function buildHeaders() {
  return {
    'apikey': SERVICE_KEY!,
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || '';

  if (q.length < 2) {
    return NextResponse.json({ listings: [] });
  }

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('[Search API] Missing env vars');
    return NextResponse.json({ listings: [] });
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rpc/search_parking`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ p_query: q, p_limit: 8 }),
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[Search API] RPC fetch error:', res.status, errorText);
      return NextResponse.json({ listings: [] });
    }

    const rows = await res.json();

    const listings = Array.isArray(rows) && rows.length > 0
      ? rows.map((r: any) => ({
          id: r.id,
          name: r.name,
          address: r.address,
          latitude: r.latitude ? parseFloat(r.latitude) : null,
          longitude: r.longitude ? parseFloat(r.longitude) : null,
        }))
      : [];

    return NextResponse.json({ listings });
  } catch (err: any) {
    if (err.name === 'TimeoutError') {
      console.error('[Search API] Timeout');
    } else {
      console.error('[Search API] Exception:', err);
    }
    return NextResponse.json({ listings: [] });
  }
}
