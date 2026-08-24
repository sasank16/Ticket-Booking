import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

export const getOrganiserDashboard = async (req: Request, res: Response) => {
  try {
    const organiserId = req.user!.id;

    // Get events organized by this user (or all if ADMIN)
    const eventFilter = req.user!.role === 'ADMIN' ? {} : { organiserId };

    const events = await prisma.event.findMany({
      where: eventFilter,
      include: {
        venue: true,
        showtimes: {
          include: {
            seats: true,
            bookings: {
              where: { status: 'CONFIRMED' },
              include: { seats: true },
            },
            waitlistEntries: {
              where: { status: 'WAITING' },
            },
          },
        },
      },
    });

    let totalRevenue = 0;
    let totalTicketsSold = 0;
    let totalCapacity = 0;
    let totalWaitlisted = 0;

    const eventSummaries = events.map((event) => {
      let eventRevenue = 0;
      let eventSold = 0;
      let eventCapacity = 0;
      let eventWaitlist = 0;

      for (const show of event.showtimes) {
        eventCapacity += show.seats.length;
        eventWaitlist += show.waitlistEntries.length;

        for (const booking of show.bookings) {
          eventRevenue += booking.totalAmount;
          eventSold += booking.seats.length;
        }
      }

      totalRevenue += eventRevenue;
      totalTicketsSold += eventSold;
      totalCapacity += eventCapacity;
      totalWaitlisted += eventWaitlist;

      const occupancyRate = eventCapacity > 0 ? ((eventSold / eventCapacity) * 100).toFixed(1) : '0';

      return {
        id: event.id,
        title: event.title,
        category: event.category,
        venueName: event.venue.name,
        showtimesCount: event.showtimes.length,
        totalCapacity: eventCapacity,
        ticketsSold: eventSold,
        occupancyRate: `${occupancyRate}%`,
        revenue: eventRevenue,
        activeWaitlist: eventWaitlist,
      };
    });

    const recentBookings = await prisma.booking.findMany({
      where: {
        showtime: {
          event: eventFilter,
        },
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        showtime: {
          include: { event: true },
        },
        seats: true,
      },
    });

    res.json({
      summary: {
        totalEvents: events.length,
        totalRevenue,
        totalTicketsSold,
        totalCapacity,
        overallOccupancy: totalCapacity > 0 ? ((totalTicketsSold / totalCapacity) * 100).toFixed(1) + '%' : '0%',
        totalWaitlisted,
      },
      events: eventSummaries,
      recentBookings,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
