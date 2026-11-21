
import express from 'express';
import { authenticate, authorize } from '../middleware/auth.ts';
import { addLog, getLogs, getGovAnalytics, getMonthlyData, getYearlyData, getFutureForecasts, getCityReport, getCityIndicators, getSectorAnalytics, estimateConsumption, getAuditLogs, getTransparencyInfo, exportLogs } from '../controllers/consumptionController.ts';
import { getCountries, getGovernorates, getCities, getSectors } from '../controllers/locationController.ts';
import { getAlerts, createAlert } from '../controllers/alertController.ts';
import { dataEngine } from '../services/dataEngine.ts';
import { govEngine } from '../services/govEngine.ts';
import { matchesEngine } from '../services/matchesEngine.ts';
import { supabase } from '../services/supabaseClient.ts';

const router = express.Router();

// Alerts
router.get('/alerts', authenticate, getAlerts);
router.post('/alerts', authenticate, authorize(['Government', 'Admin']), createAlert);

// Location Routes (Public or Authenticated)
router.get('/countries', getCountries);
router.get('/countries/:countryId/governorates', getGovernorates);
router.get('/governorates/:governorateId/cities', getCities);
router.get('/sectors', getSectors);

// User Routes
router.post('/consumption', authenticate, addLog);
router.get('/consumption', authenticate, getLogs);
router.get('/consumption/monthly', authenticate, getMonthlyData);
router.get('/consumption/yearly', authenticate, getYearlyData);
router.get('/consumption/forecast', authenticate, getFutureForecasts);
router.post('/consumption/estimate', authenticate, estimateConsumption);
router.get('/consumption/export', authenticate, exportLogs);

// Transparency & Audit
router.get('/transparency', getTransparencyInfo);
router.get('/audit', authenticate, authorize(['Admin']), getAuditLogs);

// Government Routes
router.get('/gov/analytics', authenticate, authorize(['Government', 'Admin']), getGovAnalytics);
router.get('/gov/analytics/sectors', authenticate, authorize(['Government', 'Admin']), getSectorAnalytics);
router.get('/gov/reports/city/:cityId', authenticate, authorize(['Government', 'Admin']), getCityReport);
router.get('/gov/indicators/city/:cityId', authenticate, authorize(['Government', 'Admin']), getCityIndicators);

// Additional Data Routes
router.get('/gov-services', async (req, res) => {
  try {
    const services = await govEngine.getServices();
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch gov services' });
  }
});

router.post('/gov-services/sync', async (req, res) => {
  try {
    const result = await govEngine.syncToSupabase();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync gov services' });
  }
});

router.get('/matches', async (req, res) => {
  try {
    const matches = await matchesEngine.getMatches();
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

router.post('/matches/sync', async (req, res) => {
  try {
    const result = await matchesEngine.syncToSupabase();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync matches' });
  }
});

router.get('/economy', async (req, res) => {
  const { data, error } = await supabase.from('economy_data').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/prayer-times', async (req, res) => {
  const { city, country } = req.query;
  const times = await dataEngine.getPrayerTimes(city as string, country as string);
  if (!times) return res.status(500).json({ error: 'Failed to fetch prayer times' });
  res.json(times);
});

import { rssService } from '../services/rssService.ts';

// Add the endpoint at the bottom
router.get('/rss/fetch', async (req, res) => {
  try {
    const result = await rssService.fetchDirect();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch RSS directly', details: error.message });
  }
});

export default router;
