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
            id: 'mock-owner-1',
            phone: '+919876543210',
            createdAt: new Date().toISOString(),
            listingCount: 2,
            activeListingCount: 1,
            subscriptions: [
              {
                status: 'ACTIVE',
                endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
                gracePeriodEndsAt: null,
              },
            ],
          },
        ],
      });
    }

    if (!supabaseAdmin) {
      throw new Error('Admin client not initialized');
    }

    let query = supabaseAdmin
      .from('users')
      .select(`
        *,
        subscriptions(*),
        parkingListings:parking_listings(id, status, moderationStatus)
      `)
      .order('createdAt', { ascending: false });

    if (filters.search) {
      query = query.ilike('phone', `%${filters.search}%`);
    }

    if (filters.dateFrom) {
      query = query.gte('createdAt', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('createdAt', filters.dateTo);
    }

    const { data: owners, error: dbError } = await query;

    if (dbError) {
      throw dbError;
    }

    return NextResponse.json({
      results: (owners || []).map((owner: any) => ({
        id: owner.id,
        phone: owner.phone,
        createdAt: owner.createdAt,
        subscriptions: owner.subscriptions,
        listingCount: owner.parkingListings?.length || 0,
        activeListingCount: owner.parkingListings?.filter((listing: any) => listing.status === 'ACTIVE').length || 0,
      })),
    });
  } catch (error) {
    console.error('Admin owners fetch error:', error);
    return getAdminErrorResponse(error);
  }
}
