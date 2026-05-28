import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';

const searchSchema = z.object({
  lat: z.coerce.number().min(8).max(38),   // Indian latitude bounds
  lng: z.coerce.number().min(68).max(98),  // Indian longitude bounds
  radius: z.coerce.number().min(0).max(50).default(5), // km
  type: z.enum(['PUBLIC', 'PRIVATE']).optional(),
  coverage: z.enum(['OPEN', 'COVERED', 'MULTI']).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  cursor: z.string().optional(),
});

/** Haversine distance in metres between two lat/lng points */
function haversineMetres(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildResponse(results: any[], nextCursor: string | null, source: string) {
  const response = NextResponse.json({ results, nextCursor, source });
  response.headers.set('Cache-Control', source === 'rpc'
    ? 's-maxage=300, stale-while-revalidate=59'
    : 's-maxage=60, stale-while-revalidate=30');
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  return response;
}

async function fetchParking(lat: number, lng: number, radius: number, type: any, coverage: any, limit: number, cursorDistance: number | null, cursorId: string | null) {
  // ── TIER 1: PostGIS RPC (search_nearby_parking) ──────────────────────────
  try {
    const { data: rpcResults, error: rpcError } = await supabase.rpc('search_nearby_parking', {
      p_lng: lng,
      p_lat: lat,
      p_radius: radius * 1000,   // metres
      p_limit: limit + 1,
      p_type: type || null,
      p_coverage: coverage || null,
      p_cursor_distance: cursorDistance,
      p_cursor_id: cursorId,
    });

    if (!rpcError && Array.isArray(rpcResults)) {
      return rpcResults.map((r: any) => ({ ...r, distance: Math.round(Number(r.distance)) }));
    }
    console.warn('[Nearby API] RPC failed, trying bbox fallback:', rpcError?.message);
  } catch (ex) {
    console.warn('[Nearby API] RPC threw, trying bbox fallback:', String(ex));
  }

  // ── TIER 2: Bounding-box RPC ─────────────
  try {
    const { data: bboxResults, error: bboxError } = await supabase.rpc('search_parking_bbox', {
      p_lat: lat,
      p_lng: lng,
      p_radius_km: radius,
      p_type: type || null,
      p_coverage: coverage || null,
      p_limit: Math.min(limit * 3, 300),
    });

    if (!bboxError && Array.isArray(bboxResults)) {
      const radiusMetres = radius * 1000;
      const withDist = bboxResults
        .map((r: any) => ({
          ...r,
          distance: Math.round(haversineMetres(lat, lng, Number(r.latitude), Number(r.longitude))),
        }))
        .filter((r) => r.distance <= radiusMetres)
        .sort((a, b) => a.distance - b.distance || a.id.localeCompare(b.id));

      const afterCursor = withDist.filter((r) => {
        if (cursorDistance === null) return true;
        return r.distance > cursorDistance || (r.distance === cursorDistance && r.id > (cursorId ?? ''));
      });

      return afterCursor.slice(0, limit + 1);
    }
    console.warn('[Nearby API] bbox RPC also failed:', bboxError?.message);
  } catch (ex2) {
    console.warn('[Nearby API] bbox RPC threw:', String(ex2));
  }

  return [];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const params = Object.fromEntries(searchParams);
  const parsed = searchSchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid parameters', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { lat, lng, radius, type, coverage, limit, cursor } = parsed.data;

  let cursorDistance: number | null = null;
  let cursorId: string | null = null;
  if (cursor) {
    try {
      const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString());
      cursorDistance = decoded.distance;
      cursorId = decoded.id;
    } catch {
      return NextResponse.json({ error: 'Invalid cursor' }, { status: 400 });
    }
  }

  // Adaptive radius logic
  let results = await fetchParking(lat, lng, radius, type, coverage, limit, cursorDistance, cursorId);

  // If less than 3 results, expand radius automatically
  if (results.length < 3 && radius <= 5) {
    results = await fetchParking(lat, lng, 10, type, coverage, limit, cursorDistance, cursorId);
    if (results.length < 3) {
      results = await fetchParking(lat, lng, 20, type, coverage, limit, cursorDistance, cursorId);
    }
  }

  if (results.length === 0) {
     return NextResponse.json(
      { results: [], nextCursor: null, source: 'fallback' },
      { status: 200 }
    );
  }

  let nextCursor: string | null = null;
  if (results.length > limit) {
    const last = results[limit - 1];
    nextCursor = Buffer.from(
      JSON.stringify({ distance: last.distance, id: last.id })
    ).toString('base64');
    results.pop(); // Remove the extra item used for cursor check
  }

  return buildResponse(results, nextCursor, 'rpc');
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}
