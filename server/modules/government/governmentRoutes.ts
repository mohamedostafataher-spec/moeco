
import express from 'express';
import type { Request, Response } from 'express';
import { aggregatorService } from '../../services/aggregatorService.ts';
import { osrmService } from '../../services/osrmService.ts';
import { supabase } from '../../services/supabaseClient.ts';

const router = express.Router();

/**
 * @route GET /api/government/services
 * @desc Get government services (traffic, health, etc.) for a given area.
 */
router.get('/services', async (req: Request, res: Response) => {
  try {
    const { bbox, category } = req.query;
    if (!bbox || !category) {
      return res.status(400).json({ error: 'Bbox and category are required' });
    }
    const bboxArray = (bbox as string).split(',').map(Number) as [number, number, number, number];
    const data = await aggregatorService.aggregateGovernmentServices(bboxArray, category as string);
    res.json(data);
  } catch (error) {
    console.error('Government services error:', error);
    res.status(500).json({ error: 'Failed to fetch government services' });
  }
});

/**
 * @route GET /api/government/service/:id
 * @desc Get details of a specific government service.
 */
router.get('/service/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('government_services')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Government service details error:', error);
    res.status(500).json({ error: 'Failed to fetch government service details' });
  }
});

/**
 * @route POST /api/government/suggest-transport
 * @desc Suggest a transport route to a government service.
 */
router.post('/suggest-transport', async (req: Request, res: Response) => {
  try {
    const { userLocation, serviceId } = req.body;
    if (!userLocation || !serviceId) {
      return res.status(400).json({ error: 'User location and service ID are required' });
    }

    const { data: service, error } = await supabase
      .from('government_services')
      .select('*')
      .eq('id', serviceId)
      .single();
    
    if (error) throw error;

    const route = await osrmService.calculateRoute(userLocation, [service.location_lat, service.location_lng], 'driving');
    res.json({
      service,
      route
    });
  } catch (error) {
    console.error('Government transport suggestion error:', error);
    res.status(500).json({ error: 'Failed to suggest transport' });
  }
});

/**
 * @route POST /api/government/permit/apply
 * @desc Apply for an environmental permit.
 */
router.post('/permit/apply', async (req: Request, res: Response) => {
  try {
    const { userId, permitType, details } = req.body;
    const { data, error } = await supabase
      .from('environmental_permits')
      .insert({
        user_id: userId,
        permit_type: permitType,
        details
      })
      .select()
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Permit application error:', error);
    res.status(500).json({ error: 'Failed to apply for permit' });
  }
});

/**
 * @route POST /api/government/car-emission/measure
 * @desc Log car emission measurement.
 */
router.post('/car-emission/measure', async (req: Request, res: Response) => {
  try {
    const { userId, carModel, emissionValue } = req.body;
    // (Simplified: logging to carbon tracking)
    const { data, error } = await supabase
      .from('carbon_tracking')
      .insert({
        user_id: userId,
        source_type: 'CarEmission',
        value: emissionValue,
        carbon_kg: emissionValue, // Assuming value is in kgCO2
        details: { carModel }
      })
      .select()
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Car emission measurement error:', error);
    res.status(500).json({ error: 'Failed to log car emission' });
  }
});

export default router;
