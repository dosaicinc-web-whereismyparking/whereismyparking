import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  if (process.env.NODE_ENV !== 'development' && process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH !== 'true') {
    return NextResponse.json({ error: 'Only available in development' }, { status: 403 });
  }

  try {
    if (!supabaseAdmin) {
      throw new Error('Admin client not initialized');
    }

    const demoPhone = '+910000000000';
    const demoUserId = 'demo-user-id';
    
    // 1. Ensure Demo User exists
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: demoUserId,
        phone: demoPhone,
      }, { onConflict: 'phone' })
      .select()
      .single();

    if (userError) throw userError;

    // 2. Ensure Demo User is Admin
    const { error: adminError } = await supabaseAdmin
      .from('admin_users')
      .upsert({
        userId: user.id,
      }, { onConflict: 'userId' });

    if (adminError) throw adminError;

    // 3. Create a Pending Subscription for testing
    const pendingId = 'pending-test-1';
    const { error: listingError } = await supabaseAdmin
      .from('parking_listings')
      .upsert({
        id: pendingId,
        name: 'Admin Test Spot',
        address: '123 Test Street, Mumbai',
        type: 'PRIVATE',
        coverage: 'OPEN',
        status: 'PENDING',
        ownerId: user.id,
        location: 'POINT(72.8229 18.9248)'
      }, { onConflict: 'id' });

    if (listingError) throw listingError;

    const { error: subError } = await supabaseAdmin
      .from('subscriptions')
      .upsert({
        listingId: pendingId,
        ownerId: user.id,
        status: 'PENDING_VERIFICATION',
        utr: 'UTR123456789'
      }, { onConflict: 'listingId' });

    if (subError) throw subError;

    return NextResponse.json({ 
      success: true, 
      message: 'Admin seed data created. Login with +910000000000 to access /admin' 
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
