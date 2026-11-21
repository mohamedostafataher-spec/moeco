
import express from 'express';
import type { Request, Response } from 'express';
import { sportsService } from '../../services/sportsService.ts';

const router = express.Router();

/**
 * @route GET /api/sports/matches
 * @desc Fetch upcoming matches from multiple sources.
 */
router.get('/matches', async (req: Request, res: Response) => {
  try {
    const result = await sportsService.fetchMatches();
    res.json(result);
  } catch (error) {
    console.error('Sports fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

export default router;
