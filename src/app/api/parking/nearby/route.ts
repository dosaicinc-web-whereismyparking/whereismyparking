import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';

const searchSchema = z.object({
  lat: z.coerce.number().min(8).max(38), // Indian latitude bounds
  lng: z.coerce.number().min(68).max(98), // Indian longitude bounds
  radius: z.coerce.number().min(0).max(5000).default(2000), // max 5km as per threat model
  type: z.enum(['PUBLIC', 'PRIVATE']).optional(),
  coverage: z.enum(['OPEN', 'COVERED', 'MULTI']).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  cursor: z.string().optional(), // Base64 encoded { distance, id }
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams);
    const result = searchSchema.safeParse(params);

    if (!result.success) {
      return NextResponse.json({ 
        error: 'Invalid parameters', 
        details: result.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const { lat, lng, radius, type, coverage, limit, cursor } = result.data;

    let cursorDistance = null;
    let cursorId = null;

    if (cursor) {
      try {
        const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString());
        cursorDistance = decoded.distance;
        cursorId = decoded.id;
      } catch (e) {
        return NextResponse.json({ error: 'Invalid cursor' }, { status: 400 });
      }
    }

    const { data: results, error: dbError } = await supabase.rpc('search_nearby_parking', {
      p_lng: lng,
      p_lat: lat,
      p_radius: radius,
      p_limit: limit + 1,
      p_type: type || null,
      p_coverage: coverage || null,
      p_cursor_distance: cursorDistance,
      p_cursor_id: cursorId
    });

    if (dbError) {
      console.error('Database query failed, using fallback data:', dbError);
      throw dbError; // Caught by outer catch for fallback
    }

    let nextCursor = null;
    if (results && results.length > limit) {
      const lastItem = results[limit - 1];
      nextCursor = Buffer.from(JSON.stringify({ 
        distance: Number(lastItem.distance), 
        id: lastItem.id 
      })).toString('base64');
      results.pop();
    }

    const response = NextResponse.json({
      results: (results || []).map((r: any) => ({
        ...r,
        distance: Math.round(Number(r.distance))
      })),
      nextCursor
    });

    response.headers.set('Cache-Control', 's-maxage=300, stale-while-revalidate=59');
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');

    return response;
  } catch (error) {
    console.error('Nearby search fallback mode:', error);
    
    // Fallback data for development/demo when DB is unreachable or function is missing
    const mockResults = [
        {
          id: 'mock-1',
          name: 'Nariman Point Multi-level Parking',
          address: 'Free Press Journal Marg, Nariman Point, Mumbai',
          type: 'PUBLIC',
          coverage: 'MULTI',
          status: 'ACTIVE',
          latitude: 18.9248,
          longitude: 72.8229,
          distance: 150,
        },
        {
          id: 'mock-2',
          name: 'Colaba Causeway Parking',
          address: 'Bakery Lane, Colaba, Mumbai',
          type: 'PRIVATE',
          coverage: 'OPEN',
          status: 'ACTIVE',
          latitude: 18.9220,
          longitude: 72.8347,
          distance: 850,
        }
    ];

    return NextResponse.json({
        results: mockResults,
        message: "Offline Mode: Showing sample parking spots in Mumbai.",
        nextCursor: null
    });
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}
