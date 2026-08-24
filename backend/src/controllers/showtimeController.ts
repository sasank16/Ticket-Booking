import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

export const createShowtime = async (req: Request, res: Response) => {
  try {
    const { eventId, startTime, endTime, holdTtlMinutes = 10, pricing } = req.body;

    if (!eventId || !startTime || !endTime || !pricing) {
      return res.status(400).json({ error: 'Missing required showtime fields' });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { venue: { include: { seats: true } } },
    });

    if (!event) return res.status(404).json({ error: 'Event not found' });

    const pricingObj = typeof pricing === 'string' ? JSON.parse(pricing) : pricing;
    const defaultPrices: Record<string, number> = {
      VIP: pricingObj.VIP || 50,
      PREMIUM: pricingObj.PREMIUM || 30,
      STANDARD: pricingObj.STANDARD || 15,
    };

    const showtime = await prisma.$transaction(async (tx) => {
      const newShow = await tx.showtime.create({
        data: {
          eventId,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          holdTtlMinutes: parseInt(String(holdTtlMinutes), 10) || 10,
          pricing: JSON.stringify(pricingObj),
        },
      });

      // Instantiate seats for this showtime from Venue seats
      const activeVenueSeats = event.venue.seats.filter((s) => s.isActive);
      const showSeatsData = activeVenueSeats.map((vs) => ({
        showtimeId: newShow.id,
        venueSeatId: vs.id,
        seatNumber: vs.seatNumber,
        row: vs.row,
        col: vs.col,
        category: vs.category,
        price: defaultPrices[vs.category] || defaultPrices.STANDARD || 15,
        status: 'AVAILABLE',
      }));

      await tx.showSeat.createMany({
        data: showSeatsData,
      });

      return newShow;
    });

    const fullShowtime = await prisma.showtime.findUnique({
      where: { id: showtime.id },
      include: { seats: true },
    });

    res.status(201).json({ showtime: fullShowtime });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getShowtimeSeats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const now = new Date();

    const showtime = await prisma.showtime.findUnique({
      where: { id },
      include: {
        event: {
          include: {
            venue: true,
          },
        },
        seats: {
          orderBy: [{ row: 'asc' }, { col: 'asc' }],
        },
      },
    });

    if (!showtime) return res.status(404).json({ error: 'Showtime not found' });

    // Map seats: if a seat hold has expired in real time, present it as AVAILABLE
    const sanitizedSeats = showtime.seats.map((seat) => {
      const isHoldExpired =
        seat.status === 'HELD' &&
        seat.holdExpiresAt &&
        new Date(seat.holdExpiresAt) < now;

      const currentStatus = isHoldExpired ? 'AVAILABLE' : seat.status;
      const isHeldByMe = req.user && seat.heldByUserId === req.user.id && !isHoldExpired;

      return {
        id: seat.id,
        seatNumber: seat.seatNumber,
        row: seat.row,
        col: seat.col,
        category: seat.category,
        price: seat.price,
        status: currentStatus,
        isHeldByMe,
        holdExpiresAt: seat.holdExpiresAt,
      };
    });

    // Compute category availability summary for waitlist determination
    const categoryStats: Record<string, { total: number; available: number; price: number }> = {};
    for (const s of sanitizedSeats) {
      if (!categoryStats[s.category]) {
        categoryStats[s.category] = { total: 0, available: 0, price: s.price };
      }
      categoryStats[s.category].total += 1;
      if (s.status === 'AVAILABLE') {
        categoryStats[s.category].available += 1;
      }
    }

    res.json({
      showtime: {
        id: showtime.id,
        startTime: showtime.startTime,
        endTime: showtime.endTime,
        holdTtlMinutes: showtime.holdTtlMinutes,
        event: showtime.event,
      },
      seats: sanitizedSeats,
      categoryStats,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
