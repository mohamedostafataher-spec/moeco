
import express from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../../services/supabaseClient.ts';

const router = express.Router();

/**
 * @route GET /api/leaderboard
 * @desc Get real-time leaderboard ranking.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .order('points', { ascending: false })
      .limit(Number(limit) || 10);
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

/**
 * @route GET /api/leaderboard/user/:userId
 * @desc Get user's rank on the leaderboard.
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('User rank fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch user rank' });
  }
});

export default router;
