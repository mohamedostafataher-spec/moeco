
import express from 'express';
import transportRoutes from './transport/transportRoutes.ts';
import governmentRoutes from './government/governmentRoutes.ts';
import newsRoutes from './news/newsRoutes.ts';
import utilityRoutes from './utilities/utilityRoutes.ts';
import walkingRoutes from './walking/walkingRoutes.ts';
import foodRoutes from './food/foodRoutes.ts';
import carbonRoutes from './carbon/carbonRoutes.ts';
import missionRoutes from './missions/missionRoutes.ts';
import marketRoutes from './market/marketRoutes.ts';
import leaderboardRoutes from './leaderboard/leaderboardRoutes.ts';
import alertRoutes from './alerts/alertRoutes.ts';
import mapRoutes from './map/mapRoutes.ts';
import adminRoutes from './admin/adminRoutes.ts';
import recommendationRoutes from './recommendations/recommendationRoutes.ts';
import ecoRoutes from './eco/ecoRoutes.ts';
import calculatorRoutes from './calculator/calculatorRoutes.ts';
import couponRoutes from './coupons/couponRoutes.ts';
import sportsRoutes from './sports/sportsRoutes.ts';

const router = express.Router();

// Modular Routes
router.use('/transport', transportRoutes);
router.use('/government', governmentRoutes);
router.use('/news', newsRoutes);
router.use('/utilities', utilityRoutes);
router.use('/walking', walkingRoutes);
router.use('/food', foodRoutes);
router.use('/carbon', carbonRoutes);
router.use('/missions', missionRoutes);
router.use('/market', marketRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/alerts', alertRoutes);
router.use('/map', mapRoutes);
router.use('/admin', adminRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/eco', ecoRoutes);
router.use('/calculator', calculatorRoutes);
router.use('/coupons', couponRoutes);
router.use('/sports', sportsRoutes);

export default router;
