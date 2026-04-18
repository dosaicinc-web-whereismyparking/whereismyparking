import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import {
  getAdminErrorResponse,
  logAdminActivity,
  rejectionSchema,
  requireAdminSession,
} from '@/lib/admin-auth';

const verifySchema = z
  .object({
    subscriptionId: z.string(),
    action: z.enum(['APPROVE', 'REJECT', 'ACTIVATE', 'DEACTIVATE', 'RENEW', 'EXTEND']),
    extensionDays: z.number().int().positive().optional(),
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

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession(request);
    const body = await request.json();
    const { subscriptionId, action, extensionDays, rejection } = verifySchema.parse(body);

    if (session.isBypass) {
      return NextResponse.json({
        success: true,
        subscription: {
          id: subscriptionId,
          status:
            action === 'APPROVE' || action === 'ACTIVATE' || action === 'RENEW' || action === 'EXTEND'
              ? 'ACTIVE'
              : action === 'DEACTIVATE'
                ? 'INACTIVE'
                : 'REJECTED',
          rejectionCategory: rejection?.category ?? null,
        },
      });
    }

    if (!supabaseAdmin) {
      throw new Error('Admin client not initialized');
    }

    // Use RPC to perform atomic update of subscription and listing
    const { data: result, error: rpcError } = await supabaseAdmin.rpc('verify_subscription', {
      p_subscription_id: subscriptionId,
      p_action: action,
      p_actor_user_id: session.userId,
      p_extension_days: extensionDays || 7,
      p_rejection_category: rejection?.category || null,
      p_rejection_note: rejection?.note || null
    });

    if (rpcError) {
      throw rpcError;
    }

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.error === 'Subscription not found' ? 404 : 400 });
    }

    await logAdminActivity({
      actorUserId: session.userId,
      action: `subscription.${action.toLowerCase()}`,
      targetType: 'subscription',
      targetId: subscriptionId,
      subscriptionId,
      listingId: result.listingId,
      metadata: {
        extensionDays: extensionDays ?? null,
        rejectionCategory: rejection?.category,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Subscription ${action.toLowerCase()} completed successfully.`,
      status: result.status
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }

    console.error('Admin verify subscription error:', error);
    return getAdminErrorResponse(error);
  }
}
