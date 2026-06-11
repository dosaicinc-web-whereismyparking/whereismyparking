import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase, createUserClient } from '@/lib/supabase';

const utrSchema = z.object({
  subscriptionId: z.string(),
  utr: z.string().min(12).max(20).regex(/^[A-Z0-9]+$/, 'Invalid UTR format'),
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
    const { subscriptionId, utr } = utrSchema.parse(body);

    const db = createUserClient(token);

    // 1. Verify subscription ownership
    const { data: subscription, error: subError } = await db
      .from('subscriptions')
      .select('ownerId')
      .eq('id', subscriptionId)
      .single();

    if (subError || !subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    if (subscription.ownerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // 2. Update subscription to pending verification
    // Supabase will handle the unique constraint on UTR
    const { error: updateError } = await db
      .from('subscriptions')
      .update({
        utr,
        status: 'PENDING_VERIFICATION'
      })
      .eq('id', subscriptionId);

    if (updateError) {
      if (updateError.code === '23505') { // Postgres Unique Violation
        return NextResponse.json({ error: 'This UTR has already been submitted.' }, { status: 400 });
      }
      console.error('Subscription update failed:', updateError);
      return NextResponse.json({ error: 'Failed to submit UTR', details: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      status: 'PENDING_VERIFICATION',
      message: 'UTR submitted successfully. Admin will verify your payment within 24 hours.' 
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('UTR submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
