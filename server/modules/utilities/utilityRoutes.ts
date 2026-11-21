
import express from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../../services/supabaseClient.ts';
import { carbonService } from '../../services/carbonService.ts';

const router = express.Router();

/**
 * @route POST /api/utilities/reading
 * @desc Log a utility meter reading and calculate carbon footprint.
 */
router.post('/reading', async (req: Request, res: Response) => {
  try {
    const { userId, type, reading, month, year } = req.body;
    if (!userId || !type || !reading || !month || !year) {
      return res.status(400).json({ error: 'User ID, type, reading, month, and year are required' });
    }

    // 1. Fetch previous reading
    const { data: previousReading, error: fetchError } = await supabase
      .from('utility_meters')
      .select('reading')
      .eq('user_id', userId)
      .eq('type', type)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    const prevValue = previousReading?.reading || 0;
    const consumption = reading - prevValue;
    const carbon = carbonService.calculateUtilityCarbon(consumption, type);

    // 2. Log reading
    const { data: log, error: logError } = await supabase
      .from('utility_meters')
      .insert({
        user_id: userId,
        type,
        reading,
        previous_reading: prevValue,
        consumption,
        carbon_kg: carbon,
        month,
        year
      })
      .select()
      .single();
    
    if (logError) throw logError;

    // 3. Log to carbon tracking
    const { error: carbonError } = await supabase
      .from('carbon_tracking')
      .insert({
        user_id: userId,
        source_type: type,
        value: consumption,
        carbon_kg: carbon,
        details: { month, year }
      });
    
    if (carbonError) throw carbonError;

    res.json(log);
  } catch (error) {
    console.error('Utility reading error:', error);
    res.status(500).json({ error: 'Failed to log utility reading' });
  }
});

/**
 * @route GET /api/utilities/history/:userId
 * @desc Get utility consumption history for a user.
 */
router.get('/history/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { data, error } = await supabase
      .from('utility_meters')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Utility history error:', error);
    res.status(500).json({ error: 'Failed to fetch utility history' });
  }
});

export default router;
