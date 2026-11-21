
import express from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../../services/supabaseClient.ts';
import { alertSourceService } from '../../services/alertSourceService.ts';

const router = express.Router();

/**
 * @route GET /api/alerts/direct
 * @desc Fetch alerts directly from RSS feeds.
 */
router.get('/direct', async (req: Request, res: Response) => {
  try {
    const result = await alertSourceService.fetchDirect();
    res.json(result);
  } catch (error) {
    console.error('Direct alerts fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch direct alerts' });
  }
});

/**
 * @route GET /api/alerts
 * @desc Get active alerts for a given area.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('is_active', true);
    
    if (error) throw error;

    // Filter alerts based on radius (simplified: using Haversine distance)
    const filteredAlerts = data.filter(alert => {
      const distance = calculateDistance(Number(lat), Number(lng), alert.latitude, alert.longitude);
      return distance <= (Number(radius) || alert.radius_meters) / 1000;
    });

    res.json(filteredAlerts);
  } catch (error) {
    console.error('Alerts fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

/**
 * @route POST /api/alerts/report
 * @desc Report an environmental issue (Fix My Street).
 */
router.post('/report', async (req: Request, res: Response) => {
  try {
    const { userId, title, description, category, latitude, longitude, imageUrl } = req.body;
    if (!userId || !title || !latitude || !longitude) {
      return res.status(400).json({ error: 'User ID, title, latitude, and longitude are required' });
    }

    const { data, error } = await supabase
      .from('environmental_reports')
      .insert({
        user_id: userId,
        title,
        description,
        category,
        latitude,
        longitude,
        image_url: imageUrl
      })
      .select()
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Environmental report error:', error);
    res.status(500).json({ error: 'Failed to report environmental issue' });
  }
});

// Helper function for distance calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(toRad(lat1)) * Math.cos(toRad(lat2));
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default router;
