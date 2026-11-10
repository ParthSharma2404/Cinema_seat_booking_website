import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { TicketService } from '@/server/services/ticketService';
import { validateTicketSchema } from '@/server/validations/schemas';

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, ['STAFF', 'ADMIN']);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const body = await request.json();
    const validated = validateTicketSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { qrValidationToken } = validated.data;

    const result = await TicketService.validateForEntry(
      qrValidationToken,
      auth.user.userId,
      auth.user.email
    );

    if (!result.valid) {
      // 400 for already redeemed, 404 for not found, 410 for cancelled
      const statusCode = result.status === 'NOT_FOUND' ? 404 : 400;
      return NextResponse.json(result, { status: statusCode });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Validate ticket error:', error);
    return NextResponse.json(
      { error: error.message || 'Ticket validation failed' },
      { status: 500 }
    );
  }
}
