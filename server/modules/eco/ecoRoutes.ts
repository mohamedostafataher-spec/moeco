
import express from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../../services/supabaseClient.ts';

const router = express.Router();

/**
 * @route POST /api/eco/renewable/track
 * @desc Track renewable energy generation.
 */
router.post('/renewable/track', async (req: Request, res: Response) => {
  try {
    const { userId, energySource, energyKwh } = req.body;
    const { data, error } = await supabase
      .from('renewable_energy_tracking')
      .insert({
        user_id: userId,
        energy_source: energySource,
        energy_kwh: energyKwh
      })
      .select()
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Renewable energy track error:', error);
    res.status(500).json({ error: 'Failed to track renewable energy' });
  }
});

/**
 * @route GET /api/eco/smart-grid/alerts
 * @desc Get smart grid alerts for a region.
 */
router.get('/smart-grid/alerts', async (req: Request, res: Response) => {
  try {
    const { region } = req.query;
    const { data, error } = await supabase
      .from('smart_grid_alerts')
      .select('*')
      .eq('region', region || 'Global')
      .eq('is_active', true);
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Smart grid alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch smart grid alerts' });
  }
});

/**
 * @route GET /api/eco/crowdfunding/projects
 * @desc Get environmental crowdfunding projects.
 */
router.get('/crowdfunding/projects', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('crowdfunding_projects')
      .select('*')
      .eq('status', 'Active');
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Crowdfunding projects error:', error);
    res.status(500).json({ error: 'Failed to fetch crowdfunding projects' });
  }
});

/**
 * @route POST /api/eco/crowdfunding/contribute
 * @desc Contribute to a crowdfunding project.
 */
router.post('/crowdfunding/contribute', async (req: Request, res: Response) => {
  try {
    const { userId, projectId, amount } = req.body;
    // (Simplified: updating project current amount)
    const { data: project, error: fetchError } = await supabase
      .from('crowdfunding_projects')
      .select('current_amount')
      .eq('id', projectId)
      .single();
    
    if (fetchError) throw fetchError;

    const { data, error } = await supabase
      .from('crowdfunding_projects')
      .update({ current_amount: project.current_amount + amount })
      .eq('id', projectId)
      .select()
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Crowdfunding contribution error:', error);
    res.status(500).json({ error: 'Failed to contribute' });
  }
});

export default router;
