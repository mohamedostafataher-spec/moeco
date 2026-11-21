
import EmissionFactor from '../models/EmissionFactor.ts';

export const CarbonEngine = {
  /**
   * Calculates CO2 emissions based on consumption and sector-specific factors.
   * @param consumption The amount consumed (e.g., kWh, m3)
   * @param sectorId The UUID of the sector
   * @param countryId The UUID of the country
   * @returns Calculated CO2 in kg
   */
  calculateEmissions: async (consumption: number, sectorId: string, countryId: string): Promise<number> => {
    const factorRecord = await EmissionFactor.findOne({
      where: { sectorId, countryId }
    });

    if (!factorRecord) {
      // Fallback to a default factor if not found (e.g., global average or 0.5 for electricity)
      // In a production system, we should probably throw an error or log a warning.
      console.warn(`No emission factor found for sector ${sectorId} in country ${countryId}. Using default 0.5.`);
      return consumption * 0.5;
    }

    return consumption * factorRecord.factor;
  },

  /**
   * Simulates a policy change.
   * @param baseConsumption Total consumption in a sector
   * @param reductionPercentage Percentage reduction (e.g., 15 for 15%)
   * @param sectorId The UUID of the sector
   * @param countryId The UUID of the country
   */
  simulatePolicy: async (baseConsumption: number, reductionPercentage: number, sectorId: string, countryId: string) => {
    const factorRecord = await EmissionFactor.findOne({
      where: { sectorId, countryId }
    });

    const factor = factorRecord ? factorRecord.factor : 0.5;
    const reducedConsumption = baseConsumption * (1 - reductionPercentage / 100);
    const baseCO2 = baseConsumption * factor;
    const reducedCO2 = reducedConsumption * factor;
    const savingsCO2 = baseCO2 - reducedCO2;

    return {
      baseCO2,
      reducedCO2,
      savingsCO2,
      reducedConsumption
    };
  }
};
