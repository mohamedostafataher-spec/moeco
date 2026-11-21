
import express from 'express';
import type { Request, Response } from 'express';
import { aggregatorService } from '../../services/aggregatorService.ts';
import { supabase } from '../../services/supabaseClient.ts';

const router = express.Router();

/**
 * @route GET /api/map/layers
 * @desc Get various map layers (GeoJSON).
 */
router.get('/layers', async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    // Fetch from spatial_analysis or other tables
    const { data, error } = await supabase
      .from('spatial_analysis')
      .select('*')
      .eq('analysis_type', type || 'EmissionDensity');
    
    if (error) throw error;

    // Convert to GeoJSON FeatureCollection
    const geojson = {
      type: 'FeatureCollection',
      features: data.map(item => ({
        type: 'Feature',
        geometry: item.geometry,
        properties: {
          id: item.id,
          region: item.region_name,
          value: item.value,
          type: item.analysis_type
        }
      }))
    };

    res.json(geojson);
  } catch (error) {
    console.error('Map layers error:', error);
    res.status(500).json({ error: 'Failed to fetch map layers' });
  }
});

/**
 * @route GET /api/map/heatmap
 * @desc Get heatmap data for emissions or services.
 */
router.get('/heatmap', async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    // Fetch points for heatmap
    const { data, error } = await supabase
      .from('gis_features')
      .select('latitude, longitude, properties')
      .eq('category', type || 'EmissionZone');
    
    if (error) throw error;

    const heatmapData = data.map(item => [
      item.latitude,
      item.longitude,
      item.properties?.intensity || 0.5
    ]);

    res.json(heatmapData);
  } catch (error) {
    console.error('Heatmap error:', error);
    res.status(500).json({ error: 'Failed to fetch heatmap data' });
  }
});

/**
 * @route GET /api/map/geofencing
 * @desc Get active geofencing zones.
 */
router.get('/geofencing', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('geofencing_zones')
      .select('*')
      .eq('is_active', true);
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Geofencing fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch geofencing zones' });
  }
});

/**
 * @route GET /api/map/spatial-analysis
 * @desc Get spatial analysis data (population density, etc.).
 */
router.get('/spatial-analysis', async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    const { data, error } = await supabase
      .from('spatial_analysis')
      .select('*')
      .eq('analysis_type', type || 'PopulationDensity');
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Spatial analysis error:', error);
    res.status(500).json({ error: 'Failed to fetch spatial analysis data' });
  }
});

export default router;
