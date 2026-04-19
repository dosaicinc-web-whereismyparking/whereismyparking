import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }

  const phone = request.nextUrl.searchParams.get('phone');
  if (!phone) {
    return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const dbUrl = `http://127.0.0.1:54321/otp_sessions`;

  try {
    const res = await fetch(
      `${dbUrl}?phone=eq.${encodeURIComponent(phone)}&order=created_at.desc&limit=1`,
      {
        headers: {
          'apikey': serviceKey!,
          'Authorization': `Bearer ${serviceKey}`
        }
      }
    );

    const data = await res.json();
    
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'No OTP session found' }, { status: 404 });
    }

    return NextResponse.json({ 
      phone: data[0].phone,
      otp: data[0].plain_otp,
      expires_at: data[0].expires_at,
      attempts: data[0].attempts
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Database fetch failed', details: error.message }, { status: 500 });
  }
}
