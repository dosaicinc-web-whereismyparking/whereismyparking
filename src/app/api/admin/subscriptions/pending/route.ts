import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  getAdminErrorResponse,
  parseAdminFilters,
  requireAdminSession,
} from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSession(request);
    const filters = parseAdminFilters(request.url);

    if (session.isBypass) {
      return NextResponse.json({
        results: [
          {
            id: 'mock-sub-1',
            utr: 'MOCK123456',
            status: 'PENDING_VERIFICATION',
            amount: 499,
            createdAt: new Date().toISOString(),
            gracePeriodEndsAt: null,
            listing: {
              name: 'Admin Test Spot',
              address: 'Downtown, Mumbai',
            },
            owner: {
              phone: '+910000000000',
            },
          },
        ],
      });
    }

    if (!supabaseAdmin) {
      throw new Error('Admin client not initialized');
    }

    let query = supabaseAdmin
      .from('subscriptions')
      .select(`
        *,
        listing:parking_listings(id, name, address, status, moderationStatus),
        owner:users(phone)
      `)
      .order('createdAt', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    } else {
      query = query.eq('status', 'PENDING_VERIFICATION');
    }

    if (filters.dateFrom) {
      query = query.gte('createdAt', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('createdAt', filters.dateTo);
    }

    const { data: pendingSubs, error: dbError } = await query;

    if (dbError) {
      throw dbError;
    }

    return NextResponse.json({ results: pendingSubs });
  } catch (error) {
    console.error('Admin fetch pending error:', error);
    return getAdminErrorResponse(error);
  }
}
