import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import {
  getAdminErrorResponse,
  parseAdminFilters,
  requireAdminSession,
} from '@/lib/admin-auth';

const publicParkingSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  type: z.enum(['PUBLIC', 'PRIVATE']).default('PUBLIC'),
  coverage: z.enum(['OPEN', 'COVERED', 'MULTI']),
  availableHours: z.any().optional(),
  vehicleTypes: z.array(z.string()).default([]),
  notes: z.string().optional(),
  images: z.array(z.string()).default([]),
  sourceName: z.string().optional(),
  sourceUrl: z.string().url().optional().or(z.literal('')),
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSession(request);
    const filters = parseAdminFilters(request.url);

    if (session.isBypass) {
      return NextResponse.json({
        results: [
          {
            id: 'public-record-1',
            name: 'Brigade Road Public Parking',
            address: 'Brigade Road, Bengaluru',
            latitude: 12.9719,
            longitude: 77.6079,
            coverage: 'OPEN',
            archivedAt: null,
            createdAt: new Date().toISOString(),
          },
        ],
      });
    }

    if (!supabaseAdmin) {
      throw new Error('Admin client not initialized');
    }

    let query = supabaseAdmin
      .from('public_parking_records')
      .select('*')
      .order('createdAt', { ascending: false });

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,address.ilike.%${filters.search}%`);
    }

    if (filters.status === 'ARCHIVED') {
      query = query.not('archivedAt', 'is', null);
    } else {
      query = query.is('archivedAt', null);
    }

    if (filters.dateFrom) {
      query = query.gte('createdAt', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('createdAt', filters.dateTo);
    }

    const { data: results, error: dbError } = await query;

    if (dbError) {
      throw dbError;
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Public parking fetch error:', error);
    return getAdminErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession(request);
    const body = await request.json();
    const payload = publicParkingSchema.parse(body);

    if (session.isBypass) {
      return NextResponse.json(
        {
          success: true,
          record: {
            id: 'public-record-created',
            ...payload,
            archivedAt: null,
          },
        },
        { status: 201 }
      );
    }

    if (!supabaseAdmin) {
      throw new Error('Admin client not initialized');
    }

    const { data: record, error: dbError } = await supabaseAdmin
      .from('public_parking_records')
      .insert({
        ...payload,
        sourceUrl: payload.sourceUrl || null,
      })
      .select()
      .single();

    if (dbError) {
      throw dbError;
    }

    return NextResponse.json({ success: true, record }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }

    console.error('Public parking create error:', error);
    return getAdminErrorResponse(error);
  }
}
