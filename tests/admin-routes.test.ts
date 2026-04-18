import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getAdminListings } from '@/app/api/admin/listings/route';
import { PATCH as patchAdminListing } from '@/app/api/admin/listings/[id]/route';
import { POST as verifySubscription } from '@/app/api/admin/subscriptions/verify/route';
import { GET as getPublicParking } from '@/app/api/admin/public-parking/route';
import { PATCH as patchPublicParking } from '@/app/api/admin/public-parking/[id]/route';
import { GET as exportAdminData } from '@/app/api/admin/export/route';

vi.mock('@/lib/supabase', () => {
  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    then: vi.fn().mockImplementation((onFulfilled) => {
      return Promise.resolve({ data: [], error: null }).then(onFulfilled);
    }),
  };

  return {
    supabase: {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(() => mockQuery),
      rpc: vi.fn(),
    },
    supabaseAdmin: {
      from: vi.fn(() => mockQuery),
      rpc: vi.fn(),
    },
  };
});

describe('Phase 3 admin routes (Supabase Migrated)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH = 'true';
  });

  it('returns bypass-backed listing review data', async () => {
    const request = new NextRequest('http://localhost/api/admin/listings?status=PENDING_REVIEW', {
      headers: { Authorization: 'Bearer test-token' },
    });

    const response = await getAdminListings(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.results[0].owner.phone).toBe('+919876543210');
    expect(payload.results[0].moderationStatus).toBe('PENDING_REVIEW');
  });

  it('requires structured rejection reasons for listing rejection', async () => {
    const request = new NextRequest('http://localhost/api/admin/listings/listing-1', {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'REJECT',
      }),
    });

    const response = await patchAdminListing(request, {
      params: Promise.resolve({ id: 'listing-1' }),
    });

    expect(response.status).toBe(400);
  });

  it('returns structured rejection payload for payment rejection in bypass mode', async () => {
    const request = new NextRequest('http://localhost/api/admin/subscriptions/verify', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscriptionId: 'sub-1',
        action: 'REJECT',
        rejection: {
          category: 'Payment reference invalid',
          note: 'UTR does not match settlement sheet',
        },
      }),
    });

    const response = await verifySubscription(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.subscription.status).toBe('REJECTED');
    expect(payload.subscription.rejectionCategory).toBe('Payment reference invalid');
  });

  it('returns public parking rows and archive-safe updates', async () => {
    const listRequest = new NextRequest('http://localhost/api/admin/public-parking', {
      headers: { Authorization: 'Bearer test-token' },
    });
    const listResponse = await getPublicParking(listRequest);
    const listPayload = await listResponse.json();

    expect(listResponse.status).toBe(200);
    expect(listPayload.results[0].name).toContain('Public Parking');

    const patchRequest = new NextRequest('http://localhost/api/admin/public-parking/public-record-1', {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ archive: true }),
    });
    const patchResponse = await patchPublicParking(patchRequest, {
      params: Promise.resolve({ id: 'public-record-1' }),
    });
    const patchPayload = await patchResponse.json();

    expect(patchResponse.status).toBe(200);
    expect(patchPayload.record.archivedAt).toBeTruthy();
  });

  it('builds CSV exports for the selected dataset', async () => {
    const request = new NextRequest('http://localhost/api/admin/export?dataset=owners', {
      headers: { Authorization: 'Bearer test-token' },
    });

    const response = await exportAdminData(request);
    const csv = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/csv');
    expect(csv).toContain('"owners"');
  });

  it('uses RPC verify_subscription outside bypass mode', async () => {
    process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH = 'false';
    const { supabase, supabaseAdmin } = await import('@/lib/supabase');
    
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: 'admin-1', phone: '+919999999999' } },
      error: null,
    });

    (supabaseAdmin!.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { userId: 'admin-1' }, error: null }),
      insert: vi.fn().mockResolvedValue({ error: null })
    });

    (supabaseAdmin!.rpc as any).mockResolvedValue({ 
      data: { success: true, status: 'ACTIVE', listingId: 'listing-1' }, 
      error: null 
    });

    const request = new NextRequest('http://localhost/api/admin/subscriptions/verify', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer real-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscriptionId: 'sub-1',
        action: 'APPROVE',
      }),
    });

    const response = await verifySubscription(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(supabaseAdmin!.rpc).toHaveBeenCalledWith('verify_subscription', expect.any(Object));
    expect(payload.status).toBe('ACTIVE');
  });
});
