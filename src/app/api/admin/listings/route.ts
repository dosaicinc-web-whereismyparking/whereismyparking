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
            id: 'mock-listing-1',
            name: 'Indiranagar Premium Slot',
            address: '100ft Rd, Indiranagar, Bengaluru',
            type: 'PRIVATE',
            coverage: 'COVERED',
            status: 'PENDING',
            moderationStatus: 'PENDING_REVIEW',
            owner: { phone: '+919876543210' },
            createdAt: new Date().toISOString(),
            notes: 'Covered basement slot next to lift lobby.',
            vehicleTypes: ['CAR', 'BIKE'],
            images: ['https://example.com/slot-1.jpg'],
            sourceType: 'OWNER_SUBMISSION',
            availableHours: { weekdays: '06:00-23:00' },
          },
        ],
      });
    }

    if (!supabaseAdmin) {
      throw new Error('Admin client not initialized');
    }

    let query = supabaseAdmin
      .from('parking_listings')
      .select('*, owner:users(phone)')
      .order('createdAt', { ascending: false });

    if (filters.status) {
      query = query.or(`status.eq.${filters.status},moderationStatus.eq.${filters.status}`);
    }

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,address.ilike.%${filters.search}%`);
      // Note: Searching owner phone via join in OR is not directly supported in Supabase JS client yet
      // unless using a view or raw SQL. For now, we search name/address.
    }

    if (filters.dateFrom) {
      query = query.gte('createdAt', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('createdAt', filters.dateTo);
    }

    const { data: listings, error: dbError } = await query;

    if (dbError) {
      throw dbError;
    }

    return NextResponse.json({ results: listings });
  } catch (error) {
    console.error('Admin listings fetch error:', error);
    return getAdminErrorResponse(error);
  }
}
