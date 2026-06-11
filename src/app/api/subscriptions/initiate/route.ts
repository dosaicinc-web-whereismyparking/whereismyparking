import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase, createUserClient } from '@/lib/supabase';

const initiateSchema = z.object({
  listingId: z.string(),
});

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { listingId } = initiateSchema.parse(body);

    const db = createUserClient(token);

    // 1. Verify listing ownership
    const { data: listing, error: listingError } = await db
      .from('parking_listings')
      .select('ownerId')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (listing.ownerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to subscribe this listing' }, { status: 403 });
    }

    // 2. Create or Update subscription record
    // Status starts at PENDING_PAYMENT
    const { data: subscription, error: subError } = await db
      .from('subscriptions')
      .upsert({
        listingId,
        ownerId: user.id,
        status: 'PENDING_PAYMENT',
      }, { onConflict: 'listingId' })
      .select()
      .single();

    if (subError || !subscription) {
      console.error('Subscription upsert failed:', subError);
      return NextResponse.json({ error: 'Failed to initiate subscription' }, { status: 500 });
    }

    // 3. Provide merchant UPI details for the deep link
    const merchantUpi = process.env.MERCHANT_UPI_ID || 'parking.payments@upi';
    const merchantName = process.env.MERCHANT_NAME || 'WhereIsMyParking';
    const amount = 499;

    const upiUrl = `upi://pay?pa=${merchantUpi}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Sub_${listingId}`)}`;

    return NextResponse.json({ 
      success: true, 
      subscriptionId: subscription.id,
      upiUrl,
      amount
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Subscription initiate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
