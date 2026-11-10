import prisma from '@/lib/prisma';
import { logAuditEvent } from './auditService';

export interface TicketValidationResult {
  valid: boolean;
  status: 'VALID' | 'ALREADY_REDEEMED' | 'CANCELLED' | 'NOT_FOUND';
  message: string;
  ticket?: any;
  booking?: any;
  redeemedAt?: Date | null;
}

export class TicketService {
  /**
   * Validate ticket QR or booking reference for gate entry.
   * Demonstrates strict single-use validation requirement.
   */
  static async validateForEntry(
    tokenOrRef: string,
    staffUserId: string,
    staffEmail?: string
  ): Promise<TicketValidationResult> {
    const trimmed = tokenOrRef.trim().toUpperCase();

    // 1. Locate ticket either by qrValidationToken or booking reference
    const ticket = await prisma.ticket.findFirst({
      where: {
        OR: [
          { qrValidationToken: trimmed },
          { booking: { bookingReference: trimmed } },
        ],
      },
      include: {
        booking: {
          include: {
            user: { select: { fullName: true, email: true } },
            show: {
              include: {
                movie: true,
                screen: { include: { theatre: true } },
              },
            },
            bookingSeats: {
              include: { seat: true },
            },
          },
        },
      },
    });

    if (!ticket) {
      return {
        valid: false,
        status: 'NOT_FOUND',
        message: `No ticket found matching token or reference "${trimmed}".`,
      };
    }

    // 2. Check if booking is cancelled
    if (ticket.booking.status === 'CANCELLED' || ticket.validationStatus === 'CANCELLED') {
      return {
        valid: false,
        status: 'CANCELLED',
        message: `Entry Denied: Booking #${ticket.booking.bookingReference} has been CANCELLED and refunded.`,
        ticket,
        booking: ticket.booking,
      };
    }

    // 3. Check if ALREADY REDEEMED (Strict single-use validation)
    if (ticket.validationStatus === 'REDEEMED') {
      return {
        valid: false,
        status: 'ALREADY_REDEEMED',
        message: `Entry Denied: Ticket was ALREADY REDEEMED on ${ticket.redeemedAt?.toLocaleString('en-US')}. Multiple entries not permitted.`,
        ticket,
        booking: ticket.booking,
        redeemedAt: ticket.redeemedAt,
      };
    }

    // 4. Atomically redeem the ticket
    const now = new Date();
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        validationStatus: 'REDEEMED',
        redeemedAt: now,
        redeemedByStaffId: staffUserId,
      },
      include: {
        booking: {
          include: {
            user: { select: { fullName: true, email: true } },
            show: {
              include: {
                movie: true,
                screen: { include: { theatre: true } },
              },
            },
            bookingSeats: {
              include: { seat: true },
            },
          },
        },
      },
    });

    // 5. Log audit trail
    await logAuditEvent({
      actorId: staffUserId,
      actorEmail: staffEmail,
      actorRole: 'STAFF',
      action: 'TICKET_REDEEMED',
      targetEntity: 'Ticket',
      targetId: ticket.id,
      details: {
        bookingReference: ticket.booking.bookingReference,
        qrToken: ticket.qrValidationToken,
        showTime: ticket.booking.show.startTime,
        seats: ticket.booking.bookingSeats.map(
          (bs) => `${bs.seat.rowName}${bs.seat.seatNumber}`
        ),
      },
    });

    return {
      valid: true,
      status: 'VALID',
      message: `Entry Granted! Verified for ${ticket.booking.user.fullName} (${ticket.booking.bookingSeats.length} seat(s)).`,
      ticket: updatedTicket,
      booking: updatedTicket.booking,
      redeemedAt: now,
    };
  }
}
