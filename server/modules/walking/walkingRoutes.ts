
import express from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../../services/supabaseClient.ts';
import { osrmService } from '../../services/osrmService.ts';
import { carbonService } from '../../services/carbonService.ts';

const router = express.Router();

/**
 * @route POST /api/walking/track
 * @desc Record a walking trip and calculate carbon saved.
 */
router.post('/track', async (req: Request, res: Response) => {
  try {
    const { userId, start, end, durationMinutes, steps } = req.body;
    if (!userId || !start || !end || !durationMinutes) {
      return res.status(400).json({ error: 'User ID, start, end, and duration are required' });
    }

    // 1. Calculate distance via OSRM
    const route = await osrmService.calculateRoute(start, end, 'walking');
    const distanceKm = route.distance;
    
    // 2. Calculate carbon saved (compared to driving)
    const carbonSaved = carbonService.calculateTransportCarbon(distanceKm, 'Car');

    // 3. Log walking track
    const { data: track, error: trackError } = await supabase
      .from('walking_tracking')
      .insert({
        user_id: userId,
        distance_km: distanceKm,
        duration_minutes: durationMinutes,
        steps,
        path_geometry: route.geometry,
        carbon_saved_kg: carbonSaved
      })
      .select()
      .single();
    
    if (trackError) throw trackError;

    // 4. Update user points (10 points per km)
    const points = Math.floor(distanceKm * 10);
    const { error: pointsError } = await supabase.rpc('increment_points', { user_id: userId, amount: points });
    if (pointsError) throw pointsError;

    res.json({
      track,
      points_earned: points,
      carbon_saved_kg: carbonSaved
    });
  } catch (error) {
    console.error('Walking tracking error:', error);
    res.status(500).json({ error: 'Failed to record walking track' });
  }
});

/**
 * @route GET /api/walking/history/:userId
 * @desc Get walking history for a user.
 */
router.get('/history/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { data, error } = await supabase
      .from('walking_tracking')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Walking history error:', error);
    res.status(500).json({ error: 'Failed to fetch walking history' });
  }
});

export default router;
