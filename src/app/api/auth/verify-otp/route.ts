import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyOtpHash, hashOtp } from '@/lib/crypto';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

const verifyOtpSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

const LOCKOUT_MINUTES = 15;
const MAX_ATTEMPTS = 3;

/**
 * Manually generate a Supabase-compatible session
 */
function generateSession(user: any) {
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  if (!jwtSecret) throw new Error('Missing SUPABASE_JWT_SECRET');

  const expires_in = 3600;
  const expires_at = Math.floor(Date.now() / 1000) + expires_in;

  const payload = {
    aud: 'authenticated',
    exp: expires_at,
    sub: user.id,
    email: user.email,
    phone: user.phone,
    app_metadata: user.app_metadata || { provider: 'phone', providers: ['phone'] },
    user_metadata: user.user_metadata || { phone_verified: true },
    role: 'authenticated',
  };

  const token = jwt.sign(payload, jwtSecret);

  return {
    access_token: token,
    token_type: 'bearer',
    expires_in,
    expires_at,
    refresh_token: 'manual_' + Math.random().toString(36).substring(7),
    user
  };
}

export async function POST(request: NextRequest) {

  try {
    const body = await request.json();
    const { phone, otp } = verifyOtpSchema.parse(body);

    if (process.env.NODE_ENV === 'development' && 
        process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true') {
      
      if (!supabaseAdmin) {
        return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
      }

      // Get or create user
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
      
      const whitelist = (process.env.ADMIN_WHITELISTED_MOBILES || '').split(',');
      const isAdmin = whitelist.includes(phone);
      
      const session = generateSession(user);
      
      return NextResponse.json({
        success: true,
        session,
        isAdmin
      });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }

    // 1. Fetch Session via PostgREST
    // SUPABASE_INTERNAL_URL must point to the Supabase node's private IP on Hetzner
    // (e.g. http://10.0.0.3:54321). Falls back to localhost for local dev.
    const supabaseInternal = process.env.SUPABASE_INTERNAL_URL || 'http://127.0.0.1:54321';
    const dbBaseUrl = `${supabaseInternal}/otp_sessions`;
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
    console.log('[DEV VERIFY CHECK] Input OTP:', otp);
    console.log('[DEV VERIFY CHECK] Stored Hash:', session.otp_hash);
    console.log('[DEV VERIFY CHECK] Match:', verifyOtpHash(otp, session.otp_hash));
    
    const isValid = verifyOtpHash(otp, session.otp_hash);
    
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
      await fetch(`${supabaseInternal}/admin_users`, {
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
    const authSession = generateSession(user);

    return NextResponse.json({
      success: true,
      session: authSession,
      isAdmin
    });

  } catch (error) {
    console.error('[Auth Verify] Unhandled:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

