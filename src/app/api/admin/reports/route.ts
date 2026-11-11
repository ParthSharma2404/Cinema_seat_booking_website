import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { ReportingService } from '@/server/services/reportingService';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, ['ADMIN', 'STAFF']);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const report = await ReportingService.getOccupancyAndReconciliation();
    return NextResponse.json(report);
  } catch (error: any) {
    console.error('Fetch reports error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate occupancy and sales report' },
      { status: 500 }
    );
  }
}

