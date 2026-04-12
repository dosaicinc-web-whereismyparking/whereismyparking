import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/auth/login/route';
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOtp: vi.fn(),
      verifyOtp: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      upsert: vi.fn().mockReturnThis(),
    })),
  },
}));

vi.mock('next/server', () => ({
  NextRequest: class {
    constructor(public url: string, public init?: any) {}
    async json() {
      return this.init?.body ? JSON.parse(this.init.body) : {};
    }
  },
  NextResponse: {
    json: vi.fn((data, init) => ({
      status: init?.status || 200,
      json: async () => data,
    })),
  },
}));

describe('Authentication (Phase 1) - OTP send and verify', () => {
  const phone = '+919876543210';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockFromImplementation = (fromName: string) => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    };
    return chain;
  };

  it('AUTH-01 & AUTH-05: Send OTP with cooldown', async () => {
    const fromChain = mockFromImplementation('otp_rate_limits');
    fromChain.single.mockResolvedValue({ data: null, error: null });
    (supabase.from as any).mockReturnValue(fromChain);
    (supabase.auth.signInWithOtp as any).mockResolvedValue({ error: null });

    const req1 = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, action: 'send' }),
    });

    const res1 = await POST(req1 as any);
    const data1 = await res1.json();

    expect(data1.success).toBe(true);
    expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
      phone,
      options: { channel: 'sms' },
    });

    // 2. Immediate resend (should be blocked by cooldown)
    const lastSent = new Date().toISOString();
    fromChain.single.mockResolvedValue({ 
      data: { phone, last_sent: lastSent, attempts: 0, locked_at: null }, 
      error: null 
    });

    const req2 = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, action: 'send' }),
    });

    const res2 = await POST(req2 as any);
    const data2 = await res2.json();

    expect(res2.status).toBe(429);
    expect(data2.error).toContain('Please wait');
  });

  it('AUTH-02: Verify OTP with lockout after 3 attempts', async () => {
    const fromChain = mockFromImplementation('otp_rate_limits');
    fromChain.single.mockResolvedValue({ 
      data: { phone, attempts: 2, locked_at: null }, 
      error: null 
    });
    (supabase.from as any).mockReturnValue(fromChain);
    (supabase.auth.verifyOtp as any).mockResolvedValue({ error: { message: 'Invalid OTP' } });

    const req1 = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, otp: '123456', action: 'verify' }),
    });

    const res1 = await POST(req1 as any);
    const data1 = await res1.json();

    expect(res1.status).toBe(429);
    expect(data1.error).toContain('Too many failed attempts');

    // 2. Mock account locked
    fromChain.single.mockResolvedValue({ 
      data: { phone, attempts: 3, locked_at: new Date().toISOString() }, 
      error: null 
    });

    const req2 = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, otp: '123456', action: 'verify' }),
    });

    const res2 = await POST(req2 as any);
    const data2 = await res2.json();

    expect(res2.status).toBe(429);
    expect(data2.error).toContain('Account locked');
  });

  it('AUTH-03 & AUTH-06: Successful verification and admin check', async () => {
    const fromChain = mockFromImplementation('any');
    fromChain.single
      .mockResolvedValueOnce({ data: null, error: null }) // Initial rate limit check
      .mockResolvedValueOnce({ data: { user_id: 'user123' }, error: null }); // Admin check
    (supabase.from as any).mockReturnValue(fromChain);
    
    (supabase.auth.verifyOtp as any).mockResolvedValue({ 
      data: { session: { access_token: 'token' }, user: { id: 'user123' } }, 
      error: null 
    });

    const req = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, otp: '123456', action: 'verify' }),
    });

    const res = await POST(req as any);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.session).toBeDefined();
    expect(data.isAdmin).toBe(true);
  });
});
