import { prisma } from '../config/prisma';
import { v4 as uuidv4 } from 'uuid';
import { sendWaitlistOfferEmail } from './qrEmailService';
import { broadcastSeatUpdate } from './socketService';

export const reallocateSeatToWaitlist = async (
  showtimeId: string,
  seatId: string,
  category: string
) => {
  return await prisma.$transaction(async (tx) => {
    // Check FIFO waitlist
    const nextWaitlistEntry = await tx.waitlistEntry.findFirst({
      where: {
        showtimeId: showtimeId,
        status: 'WAITING',
        OR: [
          { category: category },
          { category: 'ANY' },
        ],
      },
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        user: true,
        showtime: {
          include: {
            event: true,
          },
        },
      },
    });

    if (!nextWaitlistEntry) {
      // Revert seat to AVAILABLE
      const updated = await tx.showSeat.update({
        where: { id: seatId },
        data: {
          status: 'AVAILABLE',
          heldByUserId: null,
          holdExpiresAt: null,
          version: { increment: 1 },
        },
      });

      broadcastSeatUpdate(showtimeId, [updated]);
      return { reallocated: false, message: 'No waitlist candidate found' };
    }

    const offerTtlMinutes = 10;
    const offerExpiresAt = new Date(Date.now() + offerTtlMinutes * 60 * 1000);
    const claimToken = uuidv4();

    // Mark waitlist as OFFERED
    await tx.waitlistEntry.update({
      where: { id: nextWaitlistEntry.id },
      data: {
        status: 'OFFERED',
        allocatedSeatId: seatId,
        claimToken: claimToken,
        offerExpiresAt: offerExpiresAt,
      },
    });

    // Hold seat exclusively for this waitlisted customer
    const updatedSeat = await tx.showSeat.update({
      where: { id: seatId },
      data: {
        status: 'HELD',
        heldByUserId: nextWaitlistEntry.userId,
        holdExpiresAt: offerExpiresAt,
        version: { increment: 1 },
      },
    });

    broadcastSeatUpdate(showtimeId, [updatedSeat]);

    // Dispatch email
    await sendWaitlistOfferEmail({
      customerEmail: nextWaitlistEntry.user.email,
      customerName: nextWaitlistEntry.user.name,
      eventTitle: nextWaitlistEntry.showtime.event.title,
      showtime: nextWaitlistEntry.showtime.startTime.toLocaleString(),
      category: category,
      seatNumber: updatedSeat.seatNumber,
      claimToken: claimToken,
      offerExpiresAt: offerExpiresAt,
    });

    console.log(`[Waitlist Engine] Reallocated Seat ${updatedSeat.seatNumber} to user ${nextWaitlistEntry.user.email}`);
    return { reallocated: true, userEmail: nextWaitlistEntry.user.email, claimToken };
  });
};

export const checkAndExpireWaitlistOffers = async () => {
  const now = new Date();
  const expiredOffers = await prisma.waitlistEntry.findMany({
    where: {
      status: 'OFFERED',
      offerExpiresAt: {
        lt: now,
      },
    },
  });

  if (expiredOffers.length === 0) return 0;

  console.log(`[Waitlist Worker] Found ${expiredOffers.length} expired waitlist offers. Auto-reassigning to next in queue...`);

  for (const offer of expiredOffers) {
    await prisma.waitlistEntry.update({
      where: { id: offer.id },
      data: { status: 'EXPIRED' },
    });

    if (offer.allocatedSeatId) {
      const seat = await prisma.showSeat.findUnique({
        where: { id: offer.allocatedSeatId },
      });
      if (seat) {
        await reallocateSeatToWaitlist(offer.showtimeId, seat.id, seat.category);
      }
    }
  }

  return expiredOffers.length;
};
