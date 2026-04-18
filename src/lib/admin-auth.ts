import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export const adminStatusSchema = z.object({
  status: z.string().optional(),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export type AdminSession = {
  userId: string | null;
  phone: string;
  isBypass: boolean;
};

export class AdminRouteError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function getAdminErrorResponse(error: unknown) {
  if (error instanceof AdminRouteError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

export async function requireAdminSession(request: NextRequest): Promise<AdminSession> {
  const authHeader = request.headers.get('Authorization');
  const isBypass =
    process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true' &&
    authHeader?.includes('Bearer test-token');

  if (isBypass) {
    return {
      userId: 'dev-admin',
      phone: '+910000000000',
      isBypass: true,
    };
  }

  if (!authHeader) {
    throw new AdminRouteError(401, 'Missing authorization');
  }

  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new AdminRouteError(401, 'Unauthorized');
  }

  if (!supabaseAdmin) {
    throw new AdminRouteError(500, 'Admin client not initialized');
  }

  const { data: adminCheck, error: adminError } = await supabaseAdmin
    .from('admin_users')
    .select('userId')
    .eq('userId', data.user.id)
    .maybeSingle();

  if (adminError || !adminCheck) {
    throw new AdminRouteError(403, 'Forbidden');
  }

  return {
    userId: data.user.id,
    phone: data.user.phone ?? '',
    isBypass: false,
  };
}

export function parseAdminFilters(url: string) {
  const { searchParams } = new URL(url);
  const parsed = adminStatusSchema.parse({
    status: searchParams.get('status') ?? undefined,
    search: searchParams.get('search') ?? undefined,
    dateFrom: searchParams.get('dateFrom') ?? undefined,
    dateTo: searchParams.get('dateTo') ?? undefined,
  });

  return parsed;
}

export async function logAdminActivity(input: {
  actorUserId?: string | null;
  action: string;
  targetType: string;
  targetId: string;
  listingId?: string;
  subscriptionId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    if (!supabaseAdmin) return;

    await supabaseAdmin.from('admin_activities').insert({
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      listingId: input.listingId ?? null,
      subscriptionId: input.subscriptionId ?? null,
      metadata: input.metadata ?? null,
    });
  } catch (error) {
    console.error('Admin activity logging failed:', error);
  }
}

export const rejectionSchema = z.object({
  category: z.string().min(1, 'Rejection category is required'),
  note: z.string().trim().max(300).optional().or(z.literal('')),
});
