import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAdminErrorResponse, parseAdminFilters, requireAdminSession } from '@/lib/admin-auth';

function csvEscape(value: unknown) {
  const stringValue = String(value ?? '');
  const prefixed = /^[=\-+@]/.test(stringValue) ? `'${stringValue}` : stringValue;
  return `"${prefixed.replace(/"/g, '""')}"`;
}

function buildCsv(rows: unknown[][]) {
  return rows.map((row) => row.map(csvEscape).join(',')).join('\n');
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSession(request);
    const filters = parseAdminFilters(request.url);
    const dataset = new URL(request.url).searchParams.get('dataset') ?? 'listings';

    if (!supabaseAdmin) {
      throw new Error('Admin client not initialized');
    }

    let rows: unknown[][] = [];

    if (session.isBypass) {
      rows = [
        ['dataset', 'status', 'dateFrom', 'dateTo'],
        [dataset, filters.status ?? 'all', filters.dateFrom ?? '', filters.dateTo ?? ''],
      ];
    } else if (dataset === 'owners') {
      const { data: owners, error } = await supabaseAdmin
        .from('users')
        .select(`
          phone,
          subscriptions(status),
          parkingListings:parking_listings(count)
        `)
        .order('createdAt', { ascending: false });

      if (error) throw error;

      rows = [
        ['Owner Phone', 'Listings', 'Latest Subscription Status'],
        ...(owners || []).map((owner: any) => [
          owner.phone,
          owner.parkingListings?.[0]?.count || 0,
          owner.subscriptions?.[0]?.status ?? 'NONE',
        ]),
      ];
    } else if (dataset === 'subscriptions') {
      const { data: subscriptions, error } = await supabaseAdmin
        .from('subscriptions')
        .select(`
          status,
          utr,
          endDate,
          listing:parking_listings(name),
          owner:users(phone)
        `);

      if (error) throw error;

      rows = [
        ['Listing', 'Owner Phone', 'Status', 'UTR', 'End Date'],
        ...(subscriptions || []).map((subscription: any) => [
          subscription.listing?.name || 'N/A',
          subscription.owner?.phone || 'N/A',
          subscription.status,
          subscription.utr ?? '',
          subscription.endDate ?? '',
        ]),
      ];
    } else if (dataset === 'payments') {
      const { data: subscriptions, error } = await supabaseAdmin
        .from('subscriptions')
        .select(`
          status,
          utr,
          verifiedAt,
          listing:parking_listings(name),
          owner:users(phone)
        `)
        .not('utr', 'is', null);

      if (error) throw error;

      rows = [
        ['Listing', 'Owner Phone', 'UTR', 'Status', 'Verified At'],
        ...(subscriptions || []).map((subscription: any) => [
          subscription.listing?.name || 'N/A',
          subscription.owner?.phone || 'N/A',
          subscription.utr ?? '',
          subscription.status,
          subscription.verifiedAt ?? '',
        ]),
      ];
    } else {
      const { data: listings, error } = await supabaseAdmin
        .from('parking_listings')
        .select(`
          name,
          address,
          type,
          status,
          owner:users(phone)
        `);

      if (error) throw error;

      rows = [
        ['Name', 'Address', 'Type', 'Status', 'Owner Phone'],
        ...(listings || []).map((listing: any) => [
          listing.name,
          listing.address,
          listing.type,
          listing.status,
          listing.owner?.phone || 'N/A',
        ]),
      ];
    }

    return new NextResponse(buildCsv(rows), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${dataset}-export.csv"`,
      },
    });
  } catch (error) {
    console.error('Admin export error:', error);
    return getAdminErrorResponse(error);
  }
}
