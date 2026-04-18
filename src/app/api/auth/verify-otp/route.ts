import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyOtpHash, hashOtp } from '@/lib/crypto';
import { z } from 'zod';

const verifyOtpSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

const LOCKOUT_MINUTES = 15;
const MAX_ATTEMPTS = 3;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, otp } = verifyOtpSchema.parse(body);

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }

    // 1. Fetch Session (Using direct port 54321 for PostgREST)
    const dbBaseUrl = `http://127.0.0.1:54321/otp_sessions`;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    let session: any = null;
    try {
      const dbRes = await fetch(`${dbBaseUrl}?phone=eq.${encodeURIComponent(phone)}&order=last_sent_at.desc&limit=1`, {
        method: 'GET',
        headers: {
          'apikey': serviceKey!,
          'Authorization': `Bearer ${serviceKey}`
        }
      });
      
      if (dbRes.ok) {
        const data = await dbRes.json();
        session = data[0];
        console.log('[Auth Verify] Session found:', !!session);
      } else {
        const errText = await dbRes.text();
        console.error('[Auth Verify] DB Fetch Error Status:', dbRes.status, errText);
      }
    } catch (err) {
      console.error('[Auth Verify] DB Fetch Error Ex:', err);
    }

    if (!session) {
      return NextResponse.json({ error: 'No active session found for this number' }, { status: 404 });
    }

    // 2. Lockout Check
    if (session.locked_until && new Date(session.locked_until) > new Date()) {
      const remaining = Math.ceil((new Date(session.locked_until).getTime() - Date.now()) / (60 * 1000));
      return NextResponse.json({ 
        error: `Account locked due to too many failed attempts. Try again in ${remaining} minutes.` 
      }, { status: 429 });
    }

    // 3. Expiry Check
    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 401 });
    }

    // 4. Verify OTP
    const isValid = verifyOtpHash(otp, session.otp_hash);
    console.log('[Auth Verify] Hashing match:', isValid);
    
    if (!isValid) {
      console.log('[Auth Verify] Stored Hash:', session.otp_hash);
      console.log('[Auth Verify] Calculated Hash:', hashOtp(otp));
      
      const newAttempts = (session.attempts || 0) + 1;
      const isLocking = newAttempts >= MAX_ATTEMPTS;
      const locked_until = isLocking 
        ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString() 
        : null;

      await fetch(`${dbBaseUrl}?phone=eq.${encodeURIComponent(phone)}`, {
        method: 'PATCH',
        headers: {
          'apikey': serviceKey!,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          attempts: newAttempts,
          locked_until
        })
      });

      return NextResponse.json({ 
        error: isLocking ? 'Too many failed attempts. Account locked for 15 minutes.' : 'Invalid OTP',
        attempts_remaining: MAX_ATTEMPTS - newAttempts
      }, { status: 401 });
    }

    // 5. Success: Handle User and Session
    // First, clear the OTP session
    await fetch(`${dbBaseUrl}?phone=eq.${encodeURIComponent(phone)}`, {
      method: 'DELETE',
      headers: {
        'apikey': serviceKey!,
        'Authorization': `Bearer ${serviceKey}`
      }
    });

    // Get or Create User
    const { data: userLookup } = await supabaseAdmin.auth.admin.listUsers();
    let user = userLookup.users.find(u => u.phone === phone);

    if (!user) {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        phone,
        phone_confirm: true,
        user_metadata: { phone_verified: true }
      });
      if (createError) throw createError;
      user = newUser.user;
    }

    // Check Admin Whitelist
    const whitelist = (process.env.ADMIN_WHITELISTED_MOBILES || '').split(',');
    const isAdmin = whitelist.includes(phone);

    if (isAdmin) {
      await fetch(`http://127.0.0.1:54321/admin_users`, {
        method: 'POST',
        headers: {
          'apikey': serviceKey!,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({ userId: user.id })
      });
    }

    // Issue Session
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.createSession({
      userId: user.id,
    });

    if (sessionError) throw sessionError;

    return NextResponse.json({
      success: true,
      session: sessionData.session,
      isAdmin
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('[Auth Verify] Fatal Error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
