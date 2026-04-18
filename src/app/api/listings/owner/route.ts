import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch listings for the authenticated owner
    // Include the subscription status using Supabase join
    const { data: listings, error: dbError } = await supabase
      .from('parking_listings')
      .select('*, subscription:subscriptions(status, utr, endDate)')
      .eq('ownerId', user.id)
      .order('createdAt', { ascending: false });

    if (dbError) {
      console.error('Database query failed:', dbError);
      return NextResponse.json({ error: 'Failed to fetch listings', details: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ results: listings });

  } catch (error) {
    console.error('Fetch owner listings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
