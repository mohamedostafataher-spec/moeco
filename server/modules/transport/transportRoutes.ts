
import express from 'express';
import type { Request, Response } from 'express';
import { aggregatorService } from '../../services/aggregatorService.ts';
import { osrmService } from '../../services/osrmService.ts';
import { carbonService } from '../../services/carbonService.ts';
import { supabase } from '../../services/supabaseClient.ts';

const router = express.Router();

/**
 * @route GET /api/transport/data
 * @desc Get transport data (stations, lines) for a given area.
 */
router.get('/data', async (req: Request, res: Response) => {
  try {
    const { bbox, type } = req.query;
    if (!bbox || !type) {
      return res.status(400).json({ error: 'Bbox and type are required' });
    }
    const bboxArray = (bbox as string).split(',').map(Number) as [number, number, number, number];
    const data = await aggregatorService.aggregateTransportData(bboxArray, type as string);
    res.json(data);
  } catch (error) {
    console.error('Transport data error:', error);
    res.status(500).json({ error: 'Failed to fetch transport data' });
  }
});

/**
 * @route POST /api/transport/route
 * @desc Calculate a route and its carbon footprint.
 */
router.post('/route', async (req: Request, res: Response) => {
  try {
    const { start, end, mode } = req.body;
    if (!start || !end || !mode) {
      return res.status(400).json({ error: 'Start, end, and mode are required' });
    }

    const profile = mode === 'Walking' ? 'walking' : mode === 'Cycling' ? 'cycling' : 'driving';
    const route = await osrmService.calculateRoute(start, end, profile);
    const carbon = carbonService.calculateTransportCarbon(route.distance, mode);

    res.json({
      ...route,
      carbon_kg: carbon,
      mode
    });
  } catch (error) {
    console.error('Transport route error:', error);
    res.status(500).json({ error: 'Failed to calculate route' });
  }
});

/**
 * @route POST /api/transport/carpool/request
 * @desc Create a carpooling request.
 */
router.post('/carpool/request', async (req: Request, res: Response) => {
  try {
    const { userId, start, end, departureTime, seats } = req.body;
    const { data, error } = await supabase
      .from('carpooling_requests')
      .insert({
        user_id: userId,
        start_location_lat: start[0],
        start_location_lng: start[1],
        end_location_lat: end[0],
        end_location_lng: end[1],
        departure_time: departureTime,
        seats_available: seats
      })
      .select()
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Carpool request error:', error);
    res.status(500).json({ error: 'Failed to create carpool request' });
  }
});

/**
 * @route GET /api/transport/carpool/search
 * @desc Search for carpooling matches.
 */
router.get('/carpool/search', async (req: Request, res: Response) => {
  try {
    const { start, end } = req.query;
    // Simplified search: finding requests near start/end
    const { data, error } = await supabase
      .from('carpooling_requests')
      .select('*')
      .eq('status', 'Open');
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Carpool search error:', error);
    res.status(500).json({ error: 'Failed to search carpools' });
  }
});

export default router;
