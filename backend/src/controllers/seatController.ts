import { Request, Response } from 'express';
import { holdSeats, releaseSeats } from '../services/seatHoldService';

export const holdSeatController = async (req: Request, res: Response) => {
  try {
    const { showtimeId, seatIds } = req.body;
    const userId = req.user!.id;

    if (!showtimeId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({ error: 'showtimeId and seatIds array are required' });
    }

    const result = await holdSeats(showtimeId, seatIds, userId);

    if (!result.success) {
      return res.status(409).json({
        error: result.message,
        conflictedSeats: result.conflictedSeats,
      });
    }

    res.json({
      message: 'Seats held successfully',
      heldSeats: result.heldSeats,
      expiresAt: result.expiresAt,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const releaseSeatController = async (req: Request, res: Response) => {
  try {
    const { showtimeId, seatIds } = req.body;
    const userId = req.user!.id;

    if (!showtimeId || !seatIds || !Array.isArray(seatIds)) {
      return res.status(400).json({ error: 'showtimeId and seatIds array are required' });
    }

    const result = await releaseSeats(showtimeId, seatIds, userId);
    res.json({ message: 'Seats released', result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
