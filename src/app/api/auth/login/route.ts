import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

const sendOtpSchema = z.object({
  phone: z.string(),
  action: z.literal('send'),
});

const verifyOtpSchema = z.object({
  phone: z.string(),
  otp: z.string(),
  action: z.literal('verify'),
});

const OTP_COOLDOWN_MS = 60 * 1000;
const OTP_LOCKOUT_MS = 15 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 3;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, phone, otp } = body;
    const bypassMode = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true';

    console.log('[Auth API] Request:', { action, phone, hasOtp: !!otp, bypassMode });

    // 1. GLOBAL BYPASS
    if (bypassMode && (phone === '+910000000000' || phone === '0000000000')) {
      if (action === 'send') {
        return NextResponse.json({ success: true, message: 'Bypass mode: Use OTP 123456' });
      }
      if (action === 'verify' && otp === '123456') {
        return NextResponse.json({
          session: {
            user: { id: 'demo-user', phone: '+910000000000', email: 'demo@example.com' },
            access_token: 'test-token',
            expires_at: Math.floor(Date.now() / 1000) + 3600
          },
          isAdmin: true,
          isDemo: true
        });
      }
      if (action === 'verify') {
        return NextResponse.json({ error: 'Invalid OTP (Bypass)' }, { status: 401 });
      }
    }

    // 2. Standard Flow
    if (action === 'send') {
      const { phone: validatedPhone } = sendOtpSchema.parse(body);
      const rateLimitLookup = await supabase
        .from('otp_rate_limits')
        .select('*')
        .eq('phone', validatedPhone)
        .single();

      const rateLimit = rateLimitLookup.data as
        | { last_sent?: string; attempts?: number; locked_at?: string | null }
        | null;

      if (rateLimit?.last_sent) {
        const elapsed = Date.now() - new Date(rateLimit.last_sent).getTime();
        if (elapsed < OTP_COOLDOWN_MS) {
          return NextResponse.json(
            { error: 'Please wait before requesting another OTP.' },
            { status: 429 }
          );
        }
      }

      const { error } = await supabase.auth.signInWithOtp({
        phone: validatedPhone,
        options: { channel: 'sms' },
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });

      await supabase.from('otp_rate_limits').upsert({
        phone: validatedPhone,
        last_sent: new Date().toISOString(),
        attempts: 0,
        locked_at: null,
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'verify') {
      const { phone: validatedPhone, otp: validatedOtp } = verifyOtpSchema.parse(body);
      const rateLimitLookup = await supabase
        .from('otp_rate_limits')
        .select('*')
        .eq('phone', validatedPhone)
        .single();

      const rateLimit = rateLimitLookup.data as
        | { attempts?: number; locked_at?: string | null }
        | null;

      if (rateLimit?.locked_at) {
        const lockedElapsed = Date.now() - new Date(rateLimit.locked_at).getTime();
        if (lockedElapsed < OTP_LOCKOUT_MS) {
          return NextResponse.json({ error: 'Account locked. Please try again later.' }, { status: 429 });
        }
      }

      const { data, error } = await supabase.auth.verifyOtp({
        phone: validatedPhone,
        token: validatedOtp,
        type: 'sms'
      });

      if (error) {
        const nextAttempts = (rateLimit?.attempts ?? 0) + 1;
        const shouldLock = nextAttempts >= OTP_MAX_ATTEMPTS;

        await supabase.from('otp_rate_limits').upsert({
          phone: validatedPhone,
          attempts: nextAttempts,
          locked_at: shouldLock ? new Date().toISOString() : null,
        });

        return NextResponse.json(
          {
            error: shouldLock
              ? 'Too many failed attempts. Account locked for 15 minutes.'
              : error.message,
          },
          { status: shouldLock ? 429 : 401 }
        );
      }

      const { data: adminData } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', data.user?.id)
        .single();

      await supabase.from('otp_rate_limits').upsert({
        phone: validatedPhone,
        attempts: 0,
        locked_at: null,
      });

      return NextResponse.json({
        session: data.session,
        isAdmin: !!adminData
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Auth API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
