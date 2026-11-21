
import { storageService } from './storageService';

export const LoadSimulation = {
  simulateUsers: async (count: number) => {
    console.log(`--- Starting Load Simulation for ${count} users ---`);
    const startTime = performance.now();
    
    // Simulate data generation
    const records = [];
    for (let i = 0; i < count; i++) {
      records.push({
        id: `sim-${i}`,
        userId: `user-${Math.floor(i / 10)}`,
        co2: (i % 100) / 10,
        timestamp: new Date().toISOString(),
        Sector: { nameEn: 'Transport' }
      });
    }

    const generationTime = performance.now() - startTime;
    console.log(`Data generation took: ${generationTime.toFixed(2)}ms`);

    // Simulate metric calculation
    const calcStart = performance.now();
    const metrics = storageService.calculateMetrics(records);
    const calcTime = performance.now() - calcStart;

    console.log(`Metric calculation for ${count} records took: ${calcTime.toFixed(2)}ms`);
    
    const memoryUsage = (JSON.stringify(records).length / 1024 / 1024).toFixed(2);
    console.log(`Estimated memory usage: ${memoryUsage} MB`);

    return {
      userCount: count,
      responseTime: calcTime,
      memoryUsage: parseFloat(memoryUsage),
      status: calcTime < 500 ? 'STABLE' : 'STRESSED'
    };
  },

  runFullSuite: async () => {
    const results = [];
    results.push(await LoadSimulation.simulateUsers(10000));
    results.push(await LoadSimulation.simulateUsers(50000));
    results.push(await LoadSimulation.simulateUsers(100000));
    return results;
  }
};
