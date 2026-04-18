import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import {
  getAdminErrorResponse,
  logAdminActivity,
  rejectionSchema,
  requireAdminSession,
} from '@/lib/admin-auth';

const listingActionSchema = z
  .object({
    action: z.enum(['APPROVE', 'REJECT']),
    rejection: rejectionSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.action === 'REJECT' && !value.rejection) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Structured rejection reason is required',
        path: ['rejection'],
      });
    }
  });

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminSession(request);
    const { id } = await params;
    const body = await request.json();
    const { action, rejection } = listingActionSchema.parse(body);

    if (session.isBypass) {
      return NextResponse.json({
        success: true,
        listing: {
          id,
          status: action === 'APPROVE' ? 'ACTIVE' : 'REJECTED',
          moderationStatus: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
          rejectionCategory: rejection?.category ?? null,
          rejectionNote: rejection?.note ?? null,
        },
      });
    }

    if (!supabaseAdmin) {
      throw new Error('Admin client not initialized');
    }

    const { data: updatedListing, error: dbError } = await supabaseAdmin
      .from('parking_listings')
      .update({
        moderationStatus: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        status: action === 'APPROVE' ? 'ACTIVE' : 'REJECTED',
        reviewedAt: new Date().toISOString(),
        reviewedById: session.userId || null,
        rejectionCategory: action === 'REJECT' ? rejection?.category : null,
        rejectionNote: action === 'REJECT' ? rejection?.note || null : null,
        rejectionGuidance:
          action === 'REJECT'
            ? 'Update the listing details based on the rejection note and resubmit the same record.'
            : null,
      })
      .eq('id', id)
      .select('*, owner:users(phone)')
      .single();

    if (dbError) {
      throw dbError;
    }

    await logAdminActivity({
      actorUserId: session.userId,
      action: action === 'APPROVE' ? 'listing.approved' : 'listing.rejected',
      targetType: 'listing',
      targetId: id,
      listingId: id,
      metadata: {
        rejectionCategory: rejection?.category,
      },
    });

    return NextResponse.json({ success: true, listing: updatedListing });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }

    console.error('Admin listing update error:', error);
    return getAdminErrorResponse(error);
  }
}
