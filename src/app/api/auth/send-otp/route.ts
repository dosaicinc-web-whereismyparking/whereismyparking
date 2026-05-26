import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendSMS } from '@/lib/sms';
import { generateOtp, hashOtp } from '@/lib/crypto';
import { z } from 'zod';

const sendOtpSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  isAdmin: z.boolean().optional(),
});

const OTP_EXPIRY_MINUTES = 5;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, isAdmin } = sendOtpSchema.parse(body);

    if (process.env.NODE_ENV === 'development' && 
        process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true') {
      return NextResponse.json({ 
        success: true, 
        message: 'Dev bypass — no OTP sent' 
      });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }

    // 1. Admin Whitelist Check (Plan 06-05)
    if (isAdmin) {
      const whitelist = (process.env.ADMIN_WHITELISTED_MOBILES || '').split(',');
      if (!whitelist.includes(phone)) {
        console.warn(`[Auth] Non-whitelisted admin attempt: ${phone}`);
        return NextResponse.json({ error: 'Access denied: Mobile number not whitelisted' }, { status: 403 });
      }
    }

    // 2. Cooldown Check (Plan 06-03 - basic implementation for now)
    const { data: latestSession } = await supabaseAdmin
      .from('otp_sessions')
      .select('last_sent_at')
      .eq('phone', phone)
      .order('last_sent_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestSession) {
      const elapsed = Date.now() - new Date(latestSession.last_sent_at).getTime();
      const cooldown = 60 * 1000;
      if (elapsed < cooldown) {
        const remaining = Math.ceil((cooldown - elapsed) / 1000);
        return NextResponse.json(
          { error: 'Please wait before requesting another OTP', seconds_remaining: remaining },
          { status: 429 }
        );
      }
    }

    // 3. Generate and Send OTP
    const otp = generateOtp();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('=========================================');
      console.log(`[DEV OTP] Phone  : ${phone}`);
      console.log(`[DEV OTP] OTP    : ${otp}`);
      console.log(`[DEV OTP] Expiry : 5 minutes`);
      console.log('=========================================');
    }

    const otp_hash = hashOtp(otp);
    console.log('[DEV HASH CHECK] OTP:', otp);
    console.log('[DEV HASH CHECK] Hash:', otp_hash);
    const expires_at = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

    // 4. Store Session via PostgREST
    // SUPABASE_INTERNAL_URL must point to the Supabase node's private IP on Hetzner
    // (e.g. http://10.0.0.3:54321). Falls back to localhost for local dev.
    const supabaseInternal = process.env.SUPABASE_INTERNAL_URL || 'http://127.0.0.1:54321';
    const dbUrl = `${supabaseInternal}/otp_sessions`;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    try {
      // 4a. Cleanup existing sessions first
      await fetch(`${dbUrl}?phone=eq.${encodeURIComponent(phone)}`, {
        method: 'DELETE',
        headers: {
          'apikey': serviceKey!,
          'Authorization': `Bearer ${serviceKey}`
        }
      });

      // 4b. Insert new session
      const dbRes = await fetch(dbUrl, {
        method: 'POST',
        headers: {
          'apikey': serviceKey!,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          phone,
          otp_hash,
          expires_at,
          last_sent_at: new Date().toISOString(),
          attempts: 0,
          ...(process.env.NODE_ENV === 'development' && { plain_otp: otp })
        })
      });

      if (!dbRes.ok) {
        const errorText = await dbRes.text();
        console.error('[Auth] DB Write Error:', dbRes.status, errorText);
        throw new Error(`DB Write Failed: ${dbRes.status}`);
      }
    } catch (err: any) {
      console.error('[Auth] Fatal DB Error:', err.message);
      return NextResponse.json({ error: 'Failed to create auth session', details: err.message }, { status: 500 });
    }

    // 5. Send SMS
    const { success, error: smsError } = await sendSMS(phone, otp);

    if (!success) {
      return NextResponse.json({ error: smsError || 'Failed to send SMS' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error('[Auth] unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
