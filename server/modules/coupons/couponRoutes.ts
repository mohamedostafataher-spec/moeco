
import express from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../../services/supabaseClient.ts';
import { couponScraperService } from '../../services/couponScraperService.ts';

const router = express.Router();

/**
 * @route GET /api/coupons/direct
 * @desc Fetch coupons directly from sources.
 */
router.get('/direct', async (req: Request, res: Response) => {
  try {
    const result = await couponScraperService.fetchDirect();
    res.json(result);
  } catch (error) {
    console.error('Direct coupons fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch direct coupons' });
  }
});

/**
 * @route GET /api/coupons
 * @desc Get all active coupons.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    let query = supabase
      .from('coupons')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

export default router;
