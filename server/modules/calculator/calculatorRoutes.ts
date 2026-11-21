
import express from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../../services/supabaseClient.ts';
import { CalculationEngine } from '../../services/CalculationEngine.ts';
import { rewardEngine } from '../../services/dataEngine.ts';
import { authenticate } from '../../middleware/auth.ts';

const router = express.Router();

/**
 * @route POST /api/unified/calculator/calculate
 * @desc Perform a calculation and save it.
 */
router.post('/calculate', authenticate, async (req: any, res: Response) => {
  try {
    const { type, value, details } = req.body;
    const userId = req.user.id;

    const result = CalculationEngine.calculate({ type, value, details });

    const { data, error } = await supabase
      .from('calculations')
      .insert({
        user_id: userId,
        activity_type: type,
        input_data: { value, details },
        emissions: result.emissions,
        energy_usage: result.energy_usage,
        cost: result.cost
      })
      .select()
      .single();

    if (error) throw error;

    // Check for rewards
    const reward = await rewardEngine.checkAndAward(userId, result.emissions, type);

    res.json({
      ...data,
      reward
    });
  } catch (error) {
    console.error('Calculation error:', error);
    res.status(500).json({ error: 'Failed to perform calculation' });
  }
});

/**
 * @route GET /api/unified/calculator/history
 * @desc Get user calculation history.
 */
router.get('/history', authenticate, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { data, error } = await supabase
      .from('calculations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

/**
 * @route GET /api/unified/calculator/analytics
 * @desc Get user analytics.
 */
router.get('/analytics', authenticate, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { data, error } = await supabase
      .from('calculations')
      .select('emissions, energy_usage, cost, created_at')
      .eq('user_id', userId);

    if (error) throw error;

    const totalEmissions = data.reduce((sum, c) => sum + c.emissions, 0);
    const totalEnergy = data.reduce((sum, c) => sum + c.energy_usage, 0);
    const totalCost = data.reduce((sum, c) => sum + c.cost, 0);

    res.json({
      totalEmissions,
      totalEnergy,
      totalCost,
      count: data.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
