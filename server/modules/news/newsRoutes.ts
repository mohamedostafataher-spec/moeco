
import express from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../../services/supabaseClient.ts';
import { rssService } from '../../services/rssService.ts';

const router = express.Router();

/**
 * @route GET /api/news
 * @desc Get environmental news from Supabase.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    let query = supabase
      .from('news')
      .select('*')
      .order('published_at', { ascending: false });
    
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data, error } = await query.limit(50);
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('News fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

/**
 * @route POST /api/news/sync
 * @desc Sync news from RSS feeds to Supabase.
 */
router.post('/sync', async (req: Request, res: Response) => {
  try {
    await rssService.fetchAndSyncAll();
    res.json({ message: 'News sync triggered successfully' });
  } catch (error) {
    console.error('News sync error:', error);
    res.status(500).json({ error: 'Failed to sync news' });
  }
});

/**
 * @route GET /api/news/direct
 * @desc Fetch news directly from RSS feeds.
 */
router.get('/direct', async (req: Request, res: Response) => {
  try {
    const result = await rssService.fetchDirect();
    res.json(result);
  } catch (error) {
    console.error('Direct news fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch direct news' });
  }
});

export default router;
