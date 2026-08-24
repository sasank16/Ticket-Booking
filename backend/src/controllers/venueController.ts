import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

export const listVenues = async (req: Request, res: Response) => {
  try {
    const venues = await prisma.venue.findMany({
      include: {
        seats: {
          orderBy: [{ row: 'asc' }, { col: 'asc' }],
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ venues });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getVenue = async (req: Request, res: Response) => {
  try {
    const venue = await prisma.venue.findUnique({
      where: { id: req.params.id },
      include: {
        seats: {
          orderBy: [{ row: 'asc' }, { col: 'asc' }],
        },
      },
    });
    if (!venue) return res.status(404).json({ error: 'Venue not found' });
    res.json({ venue });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createVenue = async (req: Request, res: Response) => {
  try {
    const { name, city, address, totalRows, totalCols, seatLayout } = req.body;
    
    if (!name || !city || !address || !totalRows || !totalCols) {
      return res.status(400).json({ error: 'Missing required venue fields' });
    }

    const venue = await prisma.$transaction(async (tx) => {
      const newVenue = await tx.venue.create({
        data: {
          name,
          city,
          address,
          totalRows: parseInt(totalRows, 10),
          totalCols: parseInt(totalCols, 10),
        },
      });

      // Generate seats
      const seatsToCreate: any[] = [];
      const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

      if (seatLayout && Array.isArray(seatLayout)) {
        for (const s of seatLayout) {
          seatsToCreate.push({
            venueId: newVenue.id,
            row: s.row,
            col: s.col,
            seatNumber: s.seatNumber || `${s.row}${s.col}`,
            category: s.category || 'STANDARD',
            isActive: s.isActive ?? true,
          });
        }
      } else {
        // Default layout: rows A-Z, cols 1..totalCols
        const rows = parseInt(totalRows, 10);
        const cols = parseInt(totalCols, 10);

        for (let r = 0; r < rows; r++) {
          const rowLetter = rowLetters[r] || `R${r + 1}`;
          // Top rows VIP, middle PREMIUM, bottom STANDARD
          let category = 'STANDARD';
          if (r < Math.ceil(rows * 0.25)) category = 'VIP';
          else if (r < Math.ceil(rows * 0.65)) category = 'PREMIUM';

          for (let c = 1; c <= cols; c++) {
            seatsToCreate.push({
              venueId: newVenue.id,
              row: rowLetter,
              col: c,
              seatNumber: `${rowLetter}${c}`,
              category: category,
              isActive: true,
            });
          }
        }
      }

      await tx.venueSeat.createMany({ data: seatsToCreate });
      return newVenue;
    });

    const fullVenue = await prisma.venue.findUnique({
      where: { id: venue.id },
      include: { seats: true },
    });

    res.status(201).json({ venue: fullVenue });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
