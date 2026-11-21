
import express from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../../services/supabaseClient.ts';

const router = express.Router();

/**
 * @route GET /api/missions
 * @desc Get active daily missions.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('daily_missions')
      .select('*')
      .eq('is_active', true);
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Missions fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch missions' });
  }
});

/**
 * @route POST /api/missions/complete
 * @desc Complete a mission and earn points.
 */
router.post('/complete', async (req: Request, res: Response) => {
  try {
    const { userId, missionId, proofUrl } = req.body;
    if (!userId || !missionId) {
      return res.status(400).json({ error: 'User ID and mission ID are required' });
    }

    // 1. Check if mission is already completed
    const { data: completion, error: checkError } = await supabase
      .from('mission_completions')
      .select('*')
      .eq('user_id', userId)
      .eq('mission_id', missionId)
      .single();
    
    if (completion) {
      return res.status(400).json({ error: 'Mission already completed' });
    }

    // 2. Log completion
    const { data: log, error: logError } = await supabase
      .from('mission_completions')
      .insert({
        user_id: userId,
        mission_id: missionId,
        proof_url: proofUrl
      })
      .select()
      .single();
    
    if (logError) throw logError;

    // 3. Fetch mission details for rewards
    const { data: mission, error: missionError } = await supabase
      .from('daily_missions')
      .select('points_reward, coins_reward')
      .eq('id', missionId)
      .single();
    
    if (missionError) throw missionError;

    // 4. Update user points and coins
    const { error: pointsError } = await supabase.rpc('increment_points', { user_id: userId, amount: mission.points_reward });
    if (pointsError) throw pointsError;

    const { error: coinsError } = await supabase.rpc('increment_green_coins', { user_id: userId, amount: mission.coins_reward });
    if (coinsError) throw coinsError;

    res.json({
      message: 'Mission completed successfully',
      points_earned: mission.points_reward,
      coins_earned: mission.coins_reward
    });
  } catch (error) {
    console.error('Mission completion error:', error);
    res.status(500).json({ error: 'Failed to complete mission' });
  }
});

export default router;
