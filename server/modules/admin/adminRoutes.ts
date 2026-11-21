
import express from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../../services/supabaseClient.ts';

const router = express.Router();

/**
 * @route GET /api/admin/stats
 * @desc Get general stats for the admin dashboard.
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { count: userCount, error: userError } = await supabase.from('users').select('*', { count: 'exact', head: true });
    const { count: reportCount, error: reportError } = await supabase.from('environmental_reports').select('*', { count: 'exact', head: true });
    const { count: missionCount, error: missionError } = await supabase.from('mission_completions').select('*', { count: 'exact', head: true });
    const { data: carbonData, error: carbonError } = await supabase.from('carbon_tracking').select('carbon_kg');

    if (userError || reportError || missionError || carbonError) throw new Error('Failed to fetch stats');

    const totalCarbon = carbonData.reduce((acc, item) => acc + item.carbon_kg, 0);

    res.json({
      total_users: userCount,
      total_reports: reportCount,
      total_missions_completed: missionCount,
      total_carbon_kg: totalCarbon
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

/**
 * @route GET /api/admin/reports
 * @desc Get all environmental reports for the admin dashboard.
 */
router.get('/reports', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('environmental_reports')
      .select('*, users(full_name, email)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Admin reports error:', error);
    res.status(500).json({ error: 'Failed to fetch admin reports' });
  }
});

/**
 * @route PATCH /api/admin/report/:id
 * @desc Update the status of an environmental report.
 */
router.patch('/report/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { data, error } = await supabase
      .from('environmental_reports')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Admin report update error:', error);
    res.status(500).json({ error: 'Failed to update report status' });
  }
});

/**
 * @route GET /api/admin/config/:userId
 * @desc Get dashboard configuration for a specific user.
 */
router.get('/config/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { data, error } = await supabase
      .from('dashboard_config')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    res.json(data || {});
  } catch (error) {
    console.error('Admin config error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard config' });
  }
});

/**
 * @route POST /api/admin/config
 * @desc Save dashboard configuration.
 */
router.post('/config', async (req: Request, res: Response) => {
  try {
    const { userId, layout, theme, widgets } = req.body;
    const { data, error } = await supabase
      .from('dashboard_config')
      .upsert({ user_id: userId, layout, theme, widgets }, { onConflict: 'user_id' })
      .select()
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Admin config save error:', error);
    res.status(500).json({ error: 'Failed to save dashboard config' });
  }
});

/**
 * @route GET /api/admin/screens
 * @desc Get all app screens for management.
 */
router.get('/screens', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('app_screens')
      .select('*')
      .order('screen_key', { ascending: true });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Admin screens error:', error);
    res.status(500).json({ error: 'Failed to fetch screens' });
  }
});

/**
 * @route PATCH /api/admin/screen/:id
 * @desc Update screen settings (enable/disable, data).
 */
router.patch('/screen/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { is_enabled, data: screenData } = req.body;
    const { data, error } = await supabase
      .from('app_screens')
      .update({ is_enabled, data: screenData, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Admin screen update error:', error);
    res.status(500).json({ error: 'Failed to update screen' });
  }
});

/**
 * @route GET /api/admin/ads
 * @desc Get all ad settings.
 */
router.get('/ads', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('ad_settings')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Admin ads error:', error);
    res.status(500).json({ error: 'Failed to fetch ads' });
  }
});

/**
 * @route POST /api/admin/ad
 * @desc Create or update ad settings.
 */
router.post('/ad', async (req: Request, res: Response) => {
  try {
    const { ad_type, screen_key, ad_unit_id, is_enabled, timing, location_targeting } = req.body;
    const { data, error } = await supabase
      .from('ad_settings')
      .insert({ ad_type, screen_key, ad_unit_id, is_enabled, timing, location_targeting })
      .select()
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Admin ad save error:', error);
    res.status(500).json({ error: 'Failed to save ad settings' });
  }
});

/**
 * @route GET /api/admin/users
 * @desc Get all users for management.
 */
router.get('/users', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * @route PATCH /api/admin/user/:id/role
 * @desc Update user role.
 */
router.patch('/user/:id/role', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const { data, error } = await supabase
      .from('users')
      .update({ role, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Admin user role update error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

export default router;
