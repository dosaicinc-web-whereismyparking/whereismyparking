import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

const sendOtpSchema = z.object({
  phone: z.string().regex(/^\+91\d{10}$/, 'Invalid Indian phone number'),
  action: z.literal('send')
})

const verifyOtpSchema = z.object({
  phone: z.string().regex(/^\+91\d{10}$/, 'Invalid Indian phone number'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  action: z.literal('verify')
})

const COOLDOWN_SECONDS = 60
const LOCKOUT_MINUTES = 15
const MAX_ATTEMPTS = 3

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'send') {
      const { phone } = sendOtpSchema.parse(body)

      // Check rate limits
      const { data: rateLimit } = await supabase
        .from('otp_rate_limits')
        .select('*')
        .eq('phone', phone)
        .single()

      const now = new Date()

      if (rateLimit) {
        // Check lockout
        if (rateLimit.locked_at) {
          const lockedUntil = new Date(new Date(rateLimit.locked_at).getTime() + LOCKOUT_MINUTES * 60 * 1000)
          if (now < lockedUntil) {
            const waitTime = Math.ceil((lockedUntil.getTime() - now.getTime()) / (60 * 1000))
            return NextResponse.json({ 
              error: `Account locked. Try again in ${waitTime} minutes.` 
            }, { status: 429 })
          }
        }

        // Check cooldown
        const lastSent = new Date(rateLimit.last_sent)
        const nextAllowed = new Date(lastSent.getTime() + COOLDOWN_SECONDS * 1000)
        if (now < nextAllowed) {
          const waitTime = Math.ceil((nextAllowed.getTime() - now.getTime()) / 1000)
          return NextResponse.json({ 
            error: `Please wait ${waitTime} seconds before resending OTP.` 
          }, { status: 429 })
        }
      }

      // Send OTP
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone,
        options: {
          channel: 'sms'
        }
      })

      if (otpError) {
        return NextResponse.json({ error: otpError.message }, { status: 400 })
      }

      // Upsert rate limit record
      const { error: upsertError } = await supabase
        .from('otp_rate_limits')
        .upsert({
          phone,
          last_sent: now.toISOString(),
          // Reset attempts if lockout has expired
          attempts: (rateLimit?.locked_at && now > new Date(new Date(rateLimit.locked_at).getTime() + LOCKOUT_MINUTES * 60 * 1000)) ? 0 : (rateLimit?.attempts || 0),
          locked_at: (rateLimit?.locked_at && now > new Date(new Date(rateLimit.locked_at).getTime() + LOCKOUT_MINUTES * 60 * 1000)) ? null : rateLimit?.locked_at
        })

      if (upsertError) {
        console.error('Error updating rate limits:', upsertError)
      }

      return NextResponse.json({ success: true })
    }

    if (action === 'verify') {
      const { phone, otp } = verifyOtpSchema.parse(body)

      // Check lockout
      const { data: rateLimit } = await supabase
        .from('otp_rate_limits')
        .select('*')
        .eq('phone', phone)
        .single()

      const now = new Date()

      if (rateLimit?.locked_at) {
        const lockedUntil = new Date(new Date(rateLimit.locked_at).getTime() + LOCKOUT_MINUTES * 60 * 1000)
        if (now < lockedUntil) {
          const waitTime = Math.ceil((lockedUntil.getTime() - now.getTime()) / (60 * 1000))
          return NextResponse.json({ 
            error: `Account locked. Try again in ${waitTime} minutes.` 
          }, { status: 429 })
        }
      }

      // Verify OTP
      const { data, error: otpError } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms'
      })

      if (otpError) {
        // Increment attempts on failure
        const newAttempts = (rateLimit?.attempts || 0) + 1
        const shouldLock = newAttempts >= MAX_ATTEMPTS

        await supabase
          .from('otp_rate_limits')
          .upsert({
            phone,
            attempts: newAttempts,
            locked_at: shouldLock ? now.toISOString() : rateLimit?.locked_at,
            last_sent: rateLimit?.last_sent || now.toISOString()
          })

        if (shouldLock) {
          return NextResponse.json({ 
            error: `Too many failed attempts. Account locked for ${LOCKOUT_MINUTES} minutes.` 
          }, { status: 429 })
        }

        return NextResponse.json({ error: 'Invalid OTP' }, { status: 401 })
      }

      // Success! Reset rate limits
      await supabase
        .from('otp_rate_limits')
        .upsert({
          phone,
          attempts: 0,
          locked_at: null,
          last_sent: rateLimit?.last_sent || now.toISOString()
        })

      // Check if user is admin
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', data.user?.id)
        .single()

      return NextResponse.json({
        session: data.session,
        isAdmin: !!adminData
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Auth API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}