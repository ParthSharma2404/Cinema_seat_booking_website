import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, ['ADMIN']);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const logs = await prisma.auditLog.findMany({
      where: action ? { action } : {},
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 200),
    });

    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error('Fetch audit logs error:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}

