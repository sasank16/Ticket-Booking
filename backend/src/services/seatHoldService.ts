import { prisma } from '../config/prisma';
import { broadcastSeatUpdate } from './socketService';

export interface HoldResult {
  success: boolean;
  message?: string;
  heldSeats?: any[];
  expiresAt?: Date;
  conflictedSeats?: string[];
}

export const holdSeats = async (
  showtimeId: string,
  seatIds: string[],
  userId: string
): Promise<HoldResult> => {
  return await prisma.$transaction(async (tx) => {
    const showtime = await tx.showtime.findUnique({
      where: { id: showtimeId },
    });

    if (!showtime) {
      return { success: false, message: 'Showtime not found' };
    }

    const now = new Date();
    const ttlMinutes = showtime.holdTtlMinutes || 10;
    const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);

    // Fetch requested seats
    const seats = await tx.showSeat.findMany({
      where: {
        id: { in: seatIds },
        showtimeId: showtimeId,
      },
    });

    if (seats.length !== seatIds.length) {
      return { success: false, message: 'Some requested seats do not exist' };
    }

    // Check concurrency and conflict
    const conflicted: string[] = [];
    for (const seat of seats) {
      if (seat.status === 'BOOKED') {
        conflicted.push(seat.seatNumber);
      } else if (
        seat.status === 'HELD' &&
        seat.heldByUserId !== userId &&
        seat.holdExpiresAt &&
        seat.holdExpiresAt > now
      ) {
        conflicted.push(seat.seatNumber);
      }
    }

    if (conflicted.length > 0) {
      return {
        success: false,
        message: `Seats ${conflicted.join(', ')} are currently held or booked by another customer.`,
        conflictedSeats: conflicted,
      };
    }

    // Atomically transition candidate seats to HELD
    await tx.showSeat.updateMany({
      where: {
        id: { in: seatIds },
        showtimeId: showtimeId,
      },
      data: {
        status: 'HELD',
        heldByUserId: userId,
        holdExpiresAt: expiresAt,
        version: { increment: 1 },
      },
    });

    const updatedSeats = await tx.showSeat.findMany({
      where: { id: { in: seatIds } },
    });

    // Real-time broadcast
    broadcastSeatUpdate(showtimeId, updatedSeats);

    return {
      success: true,
      heldSeats: updatedSeats,
      expiresAt: expiresAt,
    };
  });
};

export const releaseSeats = async (
  showtimeId: string,
  seatIds: string[],
  userId: string
) => {
  return await prisma.$transaction(async (tx) => {
    await tx.showSeat.updateMany({
      where: {
        id: { in: seatIds },
        showtimeId: showtimeId,
        heldByUserId: userId,
        status: 'HELD',
      },
      data: {
        status: 'AVAILABLE',
        heldByUserId: null,
        holdExpiresAt: null,
        version: { increment: 1 },
      },
    });

    const updatedSeats = await tx.showSeat.findMany({
      where: { id: { in: seatIds } },
    });

    broadcastSeatUpdate(showtimeId, updatedSeats);
    return { success: true, releasedSeats: updatedSeats };
  });
};

export const checkAndExpireHolds = async () => {
  const now = new Date();
  
  const expiredSeats = await prisma.showSeat.findMany({
    where: {
      status: 'HELD',
      holdExpiresAt: {
        lt: now,
      },
    },
  });

  if (expiredSeats.length === 0) return 0;

  console.log(`[TTL Worker] Found ${expiredSeats.length} expired seat holds. Releasing...`);

  const showtimeMap = new Map<string, string[]>();
  for (const seat of expiredSeats) {
    if (!showtimeMap.has(seat.showtimeId)) {
      showtimeMap.set(seat.showtimeId, []);
    }
    showtimeMap.get(seat.showtimeId)!.push(seat.id);
  }

  for (const [showtimeId, seatIds] of showtimeMap.entries()) {
    await prisma.showSeat.updateMany({
      where: {
        id: { in: seatIds },
        status: 'HELD',
        holdExpiresAt: { lt: now },
      },
      data: {
        status: 'AVAILABLE',
        heldByUserId: null,
        holdExpiresAt: null,
        version: { increment: 1 },
      },
    });

    const updated = await prisma.showSeat.findMany({
      where: { id: { in: seatIds } },
    });
    broadcastSeatUpdate(showtimeId, updated);
  }

  return expiredSeats.length;
};
