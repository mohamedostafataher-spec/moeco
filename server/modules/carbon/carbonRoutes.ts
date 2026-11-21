
import express from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../../services/supabaseClient.ts';
import { carbonService } from '../../services/carbonService.ts';

const router = express.Router();

/**
 * @route POST /api/carbon/calculate
 * @desc Calculate carbon footprint for various activities.
 */
router.post('/calculate', async (req: Request, res: Response) => {
  try {
    const { userId, type, value, details } = req.body;
    if (!userId || !type || !value) {
      return res.status(400).json({ error: 'User ID, type, and value are required' });
    }

    const carbon = carbonService.calculateUtilityCarbon(value, type);

    // 1. Log to carbon tracking
    const { data: log, error: logError } = await supabase
      .from('carbon_tracking')
      .insert({
        user_id: userId,
        source_type: type,
        value,
        carbon_kg: carbon,
        details
      })
      .select()
      .single();
    
    if (logError) throw logError;

    // 2. Update user profile (total carbon saved/emitted - simplified)
    // (In a real app, we'd update a total_carbon field in profiles)

    res.json(log);
  } catch (error) {
    console.error('Carbon calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate carbon footprint' });
  }
});

/**
 * @route GET /api/carbon/summary/:userId
 * @desc Get carbon footprint summary for a user.
 */
router.get('/summary/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { data, error } = await supabase
      .from('carbon_tracking')
      .select('*')
      .eq('user_id', userId)
      .order('logged_at', { ascending: false });
    
    if (error) throw error;

    const summary = data.reduce((acc: any, item: any) => {
      acc.total_carbon_kg += item.carbon_kg;
      acc.by_type[item.source_type] = (acc.by_type[item.source_type] || 0) + item.carbon_kg;
      return acc;
    }, { total_carbon_kg: 0, by_type: {} });

    res.json(summary);
  } catch (error) {
    console.error('Carbon summary error:', error);
    res.status(500).json({ error: 'Failed to fetch carbon summary' });
  }
});

/**
 * @route GET /api/carbon/compare/:userId
 * @desc Compare user's carbon footprint with others and region average.
 */
router.get('/compare/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // 1. Get user total
    const { data: userStats, error: userError } = await supabase
      .from('leaderboard')
      .select('total_carbon_kg')
      .eq('user_id', userId)
      .single();
    
    // 2. Get region average (simplified: global average)
    const { data: allStats, error: allError } = await supabase
      .from('leaderboard')
      .select('total_carbon_kg');
    
    if (userError || allError) throw new Error('Failed to fetch comparison data');

    const totalCarbon = allStats.reduce((acc, item) => acc + item.total_carbon_kg, 0);
    const average = totalCarbon / allStats.length;

    res.json({
      user_total: userStats?.total_carbon_kg || 0,
      global_average: average,
      percent_difference: userStats ? ((userStats.total_carbon_kg - average) / average) * 100 : 0
    });
  } catch (error) {
    console.error('Carbon comparison error:', error);
    res.status(500).json({ error: 'Failed to compare carbon footprint' });
  }
});

export default router;
