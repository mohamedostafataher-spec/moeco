
export const ForecastingEngine = {
  /**
   * Simple Linear Regression to predict the next value in a sequence.
   * @param data Array of numbers (historical data)
   * @param periods Number of periods to forecast
   * @returns Array of predicted values
   */
  linearRegression: (data: number[], periods: number = 3): number[] => {
    if (data.length < 2) return Array(periods).fill(data[0] || 0);

    const n = data.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += data[i];
      sumXY += i * data[i];
      sumXX += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const predictions = [];
    for (let i = n; i < n + periods; i++) {
      predictions.push(Math.max(0, slope * i + intercept));
    }

    return predictions;
  },

  /**
   * Moving Average to smooth out trends.
   * @param data Array of numbers (historical data)
   * @param window Size of the window
   * @returns Smoothed value
   */
  movingAverage: (data: number[], window: number = 3): number => {
    if (data.length === 0) return 0;
    const subset = data.slice(-window);
    return subset.reduce((a, b) => a + b, 0) / subset.length;
  },

  /**
   * Seasonal Adjustment (simulated).
   * Adjusts a value based on the month of the year.
   * @param value The value to adjust
   * @param month The month (0-11)
   * @param sectorType The type of sector (e.g., 'electricity', 'water')
   * @returns Adjusted value
   */
  seasonalAdjustment: (value: number, month: number, sectorType: string): number => {
    // Simulated seasonal factors for Egypt
    const factors: Record<string, number[]> = {
      'electricity': [0.8, 0.8, 0.9, 1.0, 1.2, 1.5, 1.6, 1.6, 1.4, 1.1, 0.9, 0.8], // Higher in summer (AC)
      'water': [0.9, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.4, 1.3, 1.1, 1.0, 0.9], // Higher in summer
      'gas': [1.4, 1.4, 1.2, 1.0, 0.8, 0.7, 0.6, 0.6, 0.7, 0.9, 1.1, 1.3], // Higher in winter (Heating)
    };

    const sectorFactors = factors[sectorType.toLowerCase()] || Array(12).fill(1.0);
    return value * sectorFactors[month];
  }
};
