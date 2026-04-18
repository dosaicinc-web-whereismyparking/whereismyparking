import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  getAdminErrorResponse,
  requireAdminSession,
} from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSession(request);

    if (session.isBypass) {
      return NextResponse.json({
        totalListings: 42,
        pendingListings: 12,
        activeSubscriptions: 28,
        revenue: 13972,
        expiredSubscriptions: 4,
        rejectedListings: 3,
        publicListings: 11,
        privateListings: 31,
        recentActivity: [
          {
            id: 'activity-1',
            action: 'listing.approved',
            targetType: 'listing',
            targetId: 'mock-listing-1',
            createdAt: new Date().toISOString(),
          },
        ],
      });
    }

    if (!supabaseAdmin) {
      throw new Error('Admin client not initialized');
    }

    const { data: stats, error: statsError } = await supabaseAdmin.rpc('get_admin_stats');

    if (statsError) {
      throw statsError;
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Admin stats error:', error);
    return getAdminErrorResponse(error);
  }
}
