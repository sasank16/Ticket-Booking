import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

export const listEvents = async (req: Request, res: Response) => {
  try {
    const { category, search, city } = req.query;

    const where: any = {};
    if (category) {
      where.category = String(category).toUpperCase();
    }
    if (search) {
      where.OR = [
        { title: { contains: String(search) } },
        { description: { contains: String(search) } },
      ];
    }
    if (city) {
      where.venue = {
        city: { contains: String(city) },
      };
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        venue: true,
        showtimes: {
          orderBy: { startTime: 'asc' },
          include: {
            _count: {
              select: {
                seats: true,
                bookings: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ events });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getEvent = async (req: Request, res: Response) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: {
        venue: {
          include: {
            seats: true,
          },
        },
        showtimes: {
          orderBy: { startTime: 'asc' },
          include: {
            seats: {
              select: {
                id: true,
                category: true,
                status: true,
                price: true,
              },
            },
          },
        },
        organiser: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ event });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createEvent = async (req: Request, res: Response) => {
  try {
    const { title, description, category, bannerUrl, durationMinutes, venueId } = req.body;

    if (!title || !description || !category || !bannerUrl || !venueId) {
      return res.status(400).json({ error: 'Missing required event fields' });
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        category: category.toUpperCase(),
        bannerUrl,
        durationMinutes: parseInt(durationMinutes || '120', 10),
        venueId,
        organiserId: req.user!.id,
      },
      include: {
        venue: true,
      },
    });

    res.status(201).json({ event });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
