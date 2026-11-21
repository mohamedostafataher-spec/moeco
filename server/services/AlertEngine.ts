
import Alert from '../models/Alert.ts';
import User from '../models/User.ts';
import ConsumptionLog from '../models/ConsumptionLog.ts';
import { ForecastingEngine } from './ForecastingEngine.ts';

export const AlertEngine = {
  /**
   * Checks for threshold breaches and trend-based risks.
   * @param userId The UUID of the user
   * @param sectorId The UUID of the sector
   * @param countryId The UUID of the country
   */
  checkAlerts: async (userId: string, sectorId: string, countryId: string) => {
    const logs = await ConsumptionLog.findAll({
      where: { userId, sectorId, countryId },
      order: [['timestamp', 'DESC']],
      limit: 12
    });

    if (logs.length < 3) return;

    const data = logs.map(l => l.consumption).reverse();
    const current = data[data.length - 1];
    const average = data.reduce((a, b) => a + b, 0) / data.length;

    // 1. Threshold Detection (e.g., 50% above average)
    if (current > average * 1.5) {
      await Alert.create({
        userId,
        type: 'Warning',
        title: 'High Consumption Detected',
        message: `Your consumption is 50% above your average. Consider checking for leaks or inefficient appliances.`,
        severity: 'High',
        isRead: false
      });
    }

    // 2. Trend-based Prediction (e.g., predicted to exceed budget)
    const predictions = ForecastingEngine.linearRegression(data, 1);
    const predictedNext = predictions[0];

    if (predictedNext > average * 1.8) {
      await Alert.create({
        userId,
        type: 'Critical',
        title: 'Predicted Consumption Spike',
        message: `Based on your current trend, your next month's consumption is predicted to be 80% above average.`,
        severity: 'Critical',
        isRead: false
      });
    }

    // 3. Infrastructure Load (Simulated for Gov Dashboard)
    // In a real app, this would be based on aggregated city-level data.
  }
};
