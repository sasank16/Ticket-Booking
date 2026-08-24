import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

export const joinWaitlist = async (req: Request, res: Response) => {
  try {
    const { showtimeId, category = 'ANY' } = req.body;
    const userId = req.user!.id;

    if (!showtimeId) {
      return res.status(400).json({ error: 'showtimeId is required' });
    }

    // Check if user is already waiting for this showtime & category
    const existing = await prisma.waitlistEntry.findFirst({
      where: {
        showtimeId,
        userId,
        category,
        status: 'WAITING',
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'You are already in the waitlist for this category' });
    }

    const waitlistEntry = await prisma.waitlistEntry.create({
      data: {
        showtimeId,
        userId,
        category,
        status: 'WAITING',
      },
      include: {
        showtime: {
          include: {
            event: true,
          },
        },
      },
    });

    // Count position in queue
    const queuePosition = await prisma.waitlistEntry.count({
      where: {
        showtimeId,
        category,
        status: 'WAITING',
        createdAt: { lte: waitlistEntry.createdAt },
      },
    });

    res.status(201).json({
      message: 'Successfully joined waitlist',
      waitlistEntry,
      queuePosition,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyWaitlistEntries = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const entries = await prisma.waitlistEntry.findMany({
      where: { userId },
      include: {
        showtime: {
          include: {
            event: { include: { venue: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ entries });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getWaitlistOffer = async (req: Request, res: Response) => {
  try {
    const { claimToken } = req.params;
    const now = new Date();

    const entry = await prisma.waitlistEntry.findUnique({
      where: { claimToken },
      include: {
        user: { select: { id: true, name: true, email: true } },
        showtime: {
          include: {
            event: { include: { venue: true } },
          },
        },
      },
    });

    if (!entry) return res.status(404).json({ error: 'Waitlist offer token not found' });
    if (entry.status !== 'OFFERED') {
      return res.status(400).json({ error: `Offer is no longer valid (Status: ${entry.status})` });
    }
    if (entry.offerExpiresAt && entry.offerExpiresAt < now) {
      return res.status(410).json({ error: 'Waitlist offer has expired' });
    }

    let seat = null;
    if (entry.allocatedSeatId) {
      seat = await prisma.showSeat.findUnique({
        where: { id: entry.allocatedSeatId },
      });
    }

    res.json({
      offer: {
        id: entry.id,
        claimToken: entry.claimToken,
        category: entry.category,
        offerExpiresAt: entry.offerExpiresAt,
        showtime: entry.showtime,
        seat: seat,
        user: entry.user,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const claimWaitlistOffer = async (req: Request, res: Response) => {
  try {
    const { claimToken, customerName, customerEmail, customerPhone } = req.body;
    const userId = req.user!.id;
    const now = new Date();

    const entry = await prisma.waitlistEntry.findUnique({
      where: { claimToken },
      include: {
        showtime: true,
      },
    });

    if (!entry) return res.status(404).json({ error: 'Offer not found' });
    if (entry.status !== 'OFFERED') {
      return res.status(400).json({ error: `Offer status is ${entry.status}` });
    }
    if (entry.offerExpiresAt && entry.offerExpiresAt < now) {
      return res.status(410).json({ error: 'Offer has expired' });
    }
    if (!entry.allocatedSeatId) {
      return res.status(400).json({ error: 'No seat allocated for this offer' });
    }

    // Mark waitlist entry CLAIMED
    await prisma.waitlistEntry.update({
      where: { id: entry.id },
      data: { status: 'CLAIMED' },
    });

    // Delegate to regular booking creation using allocated seat
    req.body.showtimeId = entry.showtimeId;
    req.body.seatIds = [entry.allocatedSeatId];

    // Forward to booking creation
    const { createBooking } = await import('./bookingController');
    return createBooking(req, res);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
