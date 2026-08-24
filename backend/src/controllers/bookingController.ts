import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { generateQRCodeDataUrl, sendBookingConfirmationEmail } from '../services/qrEmailService';
import { broadcastSeatUpdate } from '../services/socketService';
import { reallocateSeatToWaitlist } from '../services/waitlistService';
import { v4 as uuidv4 } from 'uuid';

export const createBooking = async (req: Request, res: Response) => {
  try {
    const { showtimeId, seatIds, customerName, customerEmail, customerPhone } = req.body;
    const userId = req.user!.id;

    if (!showtimeId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({ error: 'showtimeId and seatIds array are required' });
    }

    const name = customerName || req.user!.name;
    const email = customerEmail || req.user!.email;

    const result = await prisma.$transaction(async (tx) => {
      const showtime = await tx.showtime.findUnique({
        where: { id: showtimeId },
        include: {
          event: { include: { venue: true } },
        },
      });

      if (!showtime) {
        throw new Error('Showtime not found');
      }

      const now = new Date();
      const seats = await tx.showSeat.findMany({
        where: {
          id: { in: seatIds },
          showtimeId: showtimeId,
        },
      });

      if (seats.length !== seatIds.length) {
        throw new Error('Some selected seats do not exist');
      }

      // Verify that all seats are held by this user and not expired
      for (const seat of seats) {
        if (seat.status === 'BOOKED') {
          throw new Error(`Seat ${seat.seatNumber} is already booked.`);
        }
        if (seat.status !== 'HELD' || seat.heldByUserId !== userId) {
          throw new Error(`Seat ${seat.seatNumber} is not held by you. Please select and hold first.`);
        }
        if (seat.holdExpiresAt && seat.holdExpiresAt < now) {
          throw new Error(`Seat ${seat.seatNumber} hold has expired. Please select again.`);
        }
      }

      const totalAmount = seats.reduce((sum, s) => sum + s.price, 0);
      const bookingRef = 'BK-' + uuidv4().substring(0, 8).toUpperCase();

      // Update seats to BOOKED
      await tx.showSeat.updateMany({
        where: { id: { in: seatIds } },
        data: {
          status: 'BOOKED',
          heldByUserId: null,
          holdExpiresAt: null,
          version: { increment: 1 },
        },
      });

      // Generate QR Code data payload
      const qrPayload = {
        bookingRef,
        showtimeId,
        event: showtime.event.title,
        venue: showtime.event.venue.name,
        seats: seats.map((s) => s.seatNumber),
        customer: { name, email },
        totalAmount,
        timestamp: new Date().toISOString(),
      };

      const qrCodeDataUrl = await generateQRCodeDataUrl(qrPayload);

      // Create Booking record
      const booking = await tx.booking.create({
        data: {
          bookingRef,
          userId,
          showtimeId,
          totalAmount,
          status: 'CONFIRMED',
          qrCode: qrCodeDataUrl,
          customerName: name,
          customerEmail: email,
          customerPhone: customerPhone || null,
          seats: {
            create: seats.map((s) => ({
              showSeatId: s.id,
              seatPrice: s.price,
              seatNumber: s.seatNumber,
              category: s.category,
            })),
          },
        },
        include: {
          seats: true,
          showtime: {
            include: {
              event: {
                include: { venue: true },
              },
            },
          },
        },
      });

      return { booking, seats, showtime, qrCodeDataUrl };
    });

    // Real-time broadcast
    const updatedSeats = await prisma.showSeat.findMany({
      where: { id: { in: seatIds } },
    });
    broadcastSeatUpdate(showtimeId, updatedSeats);

    // Send confirmation email asynchronously
    sendBookingConfirmationEmail({
      customerEmail: email,
      customerName: name,
      bookingRef: result.booking.bookingRef,
      eventTitle: result.showtime.event.title,
      venueName: result.showtime.event.venue.name,
      showtime: result.showtime.startTime.toLocaleString(),
      seats: result.seats.map((s) => s.seatNumber),
      totalAmount: result.booking.totalAmount,
      qrCodeDataUrl: result.qrCodeDataUrl,
    });

    res.status(201).json({
      message: 'Booking confirmed successfully',
      booking: result.booking,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Booking failed' });
  }
};

export const getMyBookings = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        seats: true,
        showtime: {
          include: {
            event: {
              include: { venue: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ bookings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getBookingByRef = async (req: Request, res: Response) => {
  try {
    const { ref } = req.params;
    const booking = await prisma.booking.findUnique({
      where: { bookingRef: ref },
      include: {
        seats: true,
        showtime: {
          include: {
            event: {
              include: { venue: true },
            },
          },
        },
      },
    });

    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json({ booking });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const cancelBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        seats: true,
        showtime: true,
      },
    });

    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.userId !== userId && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized to cancel this booking' });
    }
    if (booking.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Booking is already cancelled' });
    }

    // Mark booking as CANCELLED
    await prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    // Process each seat for waitlist reallocation
    for (const bSeat of booking.seats) {
      await reallocateSeatToWaitlist(booking.showtimeId, bSeat.showSeatId, bSeat.category);
    }

    res.json({ message: 'Booking cancelled successfully. Reallocating seats...' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
