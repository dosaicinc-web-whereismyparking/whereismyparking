import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const searchSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
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

    const queryParams: any[] = [lng, lat, radius, limit + 1];
    let cursorFilter = '';

    if (cursor) {
      try {
        const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString());
        // $5 = distance, $6 = id
        cursorFilter = `AND (ST_Distance("location", ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) > $5 
                         OR (ST_Distance("location", ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) = $5 AND "id" > $6))`
        queryParams.push(decoded.distance, decoded.id);
      } catch (e) {
        return NextResponse.json({ error: 'Invalid cursor' }, { status: 400 });
      }
    }

    let typeFilter = '';
    if (type) {
      typeFilter = `AND "type" = $${queryParams.length + 1}::"ParkingType"`;
      queryParams.push(type);
    }

    let coverageFilter = '';
    if (coverage) {
      coverageFilter = `AND "coverage" = $${queryParams.length + 1}::"CoverageType"`;
      queryParams.push(coverage);
    }

    // Prisma $queryRaw uses $1, $2 for postgres
    const query = `
      SELECT 
        "id", "name", "address", "type", "coverage", "availableHours", "status",
        ST_X("location"::geometry) AS longitude,
        ST_Y("location"::geometry) AS latitude,
        ST_Distance("location", ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance
      FROM "parking_listings"
      WHERE ST_DWithin("location", ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
      AND "status" = 'ACTIVE'
      ${typeFilter}
      ${coverageFilter}
      ${cursorFilter}
      ORDER BY distance ASC, "id" ASC
      LIMIT $4
    `;

    const results = await prisma.$queryRawUnsafe(query, ...queryParams) as any[];

    let nextCursor = null;
    if (results.length > limit) {
      const lastItem = results[limit - 1];
      nextCursor = Buffer.from(JSON.stringify({ 
        distance: Number(lastItem.distance), 
        id: lastItem.id 
      })).toString('base64');
      results.pop();
    }

    if (results.length === 0 && !cursor) {
      return NextResponse.json({
        results: [],
        message: "No parking found within the specified radius. Try expanding your search or removing filters.",
        nextCursor: null
      });
    }

    const response = NextResponse.json({
      results: results.map(r => ({
        ...r,
        distance: Math.round(Number(r.distance))
      })),
      nextCursor
    });

    // Cache-Control: s-maxage=300 (5 mins)
    response.headers.set('Cache-Control', 's-maxage=300, stale-while-revalidate=59');
    // CORS
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');

    return response;

  } catch (error) {
    console.error('Nearby search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}
