import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || '';
  
  if (q.length < 2) {
    return NextResponse.json({ listings: [] });
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  try {
    // PostgREST standalone on Mac Mini doesn't use /rest/v1 prefix
    const baseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '');
    
    // We use raw fetch with application/geo+json header to extract lat/lng from PostGIS location
    const res = await fetch(
      `${baseUrl}/parking_listings?` +
      `or=(name.ilike.%${q}%,address.ilike.%${q}%)&` +
      `status=eq.ACTIVE&` +
      `select=id,name,address,location&` +
      `limit=5`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Accept': 'application/geo+json'
        }
      }
    );
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('[Search API] Fetch error:', errorText);
      return NextResponse.json({ listings: [] });
    }
    
    const geojson = await res.json();
    const listings = (geojson.features || []).map((f: any) => ({
      id: f.properties.id,
      name: f.properties.name,
      address: f.properties.address,
      longitude: f.geometry.coordinates[0],
      latitude: f.geometry.coordinates[1]
    }));
    
    return NextResponse.json({ listings });
  } catch (err) {
    console.error('[Search API] Exception:', err);
    return NextResponse.json({ listings: [] });
  }
}
