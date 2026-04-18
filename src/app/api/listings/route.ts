import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';

const listingSchema = z.object({
  name: z.string().min(3).max(100),
  address: z.string().min(5).max(255),
  type: z.enum(['PUBLIC', 'PRIVATE']),
  coverage: z.enum(['OPEN', 'COVERED', 'MULTI']),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  availableHours: z.any().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized', details: authError?.message }, { status: 401 });
    }

    // 2. Validate body
    const body = await request.json();
    const result = listingSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ 
        error: 'Invalid listing data', 
        details: result.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const { name, address, type, coverage, latitude, longitude, availableHours } = result.data;

    // 3. Insert using Supabase client
    const id = `listing_${Math.random().toString(36).substring(2, 9)}`;
    
    const { error: insertError } = await supabase.from('parking_listings').insert({
      id,
      name,
      address,
      location: `POINT(${longitude} ${latitude})`, // WKT format for geography/geometry
      type,
      coverage,
      availableHours: availableHours || {},
      status: 'PENDING',
      ownerId: user.id
    });

    if (insertError) {
      console.error('Database insert failed:', insertError);
      return NextResponse.json({ error: 'Failed to create listing', details: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      id,
      status: 'PENDING',
      message: 'Listing created and pending subscription initiation.'
    }, { status: 201 });

  } catch (error) {
    console.error('Create listing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
