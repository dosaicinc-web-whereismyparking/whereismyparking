import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { getAdminErrorResponse, requireAdminSession } from '@/lib/admin-auth';

const updatePublicParkingSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  coverage: z.enum(['OPEN', 'COVERED', 'MULTI']).optional(),
  notes: z.string().optional(),
  archive: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminSession(request);
    const { id } = await params;
    const body = await request.json();
    const payload = updatePublicParkingSchema.parse(body);

    if (session.isBypass) {
      return NextResponse.json({
        success: true,
        record: {
          id,
          archivedAt: payload.archive ? new Date().toISOString() : null,
        },
      });
    }

    if (!supabaseAdmin) {
      throw new Error('Admin client not initialized');
    }

    const { archive, ...updateData } = payload;
    const data: any = { ...updateData };
    if (archive) {
      data.archivedAt = new Date().toISOString();
    }

    const { data: record, error: dbError } = await supabaseAdmin
      .from('public_parking_records')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (dbError) {
      throw dbError;
    }

    return NextResponse.json({ success: true, record });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }

    console.error('Public parking update error:', error);
    return getAdminErrorResponse(error);
  }
}
