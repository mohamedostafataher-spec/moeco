
import ConsumptionLog from '../models/ConsumptionLog.ts';
import User from '../models/User.ts';
import Sector from '../models/Sector.ts';
import City from '../models/City.ts';
import Governorate from '../models/Governorate.ts';
import Country from '../models/Country.ts';

export const ReportingEngine = {
  /**
   * Generates a monthly report for a citizen.
   * @param userId The UUID of the user
   * @param month The month (0-11)
   * @param year The year
   */
  generateCitizenMonthlyReport: async (userId: string, month: number, year: number) => {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 1);

    const logs = await ConsumptionLog.findAll({
      where: { userId, timestamp: { [Symbol.for('gte')]: startDate, [Symbol.for('lt')]: endDate } },
      include: [Sector, City, Country]
    });

    const totalCO2 = logs.reduce((a, b) => a + b.co2, 0);
    const totalCost = logs.reduce((a, b) => a + b.cost, 0);
    const breakdown = logs.reduce((acc: any, l: any) => {
      const sectorName = l.Sector.nameEn;
      acc[sectorName] = (acc[sectorName] || 0) + l.co2;
      return acc;
    }, {});

    return {
      userId,
      month,
      year,
      totalCO2,
      totalCost,
      breakdown,
      recordCount: logs.length
    };
  },

  /**
   * Generates a sustainability report for a city.
   * @param cityId The UUID of the city
   */
  generateCitySustainabilityReport: async (cityId: string) => {
    const logs = await ConsumptionLog.findAll({
      where: { cityId },
      include: [Sector]
    });

    const totalCO2 = logs.reduce((a, b) => a + b.co2, 0);
    const sectorBreakdown = logs.reduce((acc: any, l: any) => {
      const sectorName = l.Sector.nameEn;
      acc[sectorName] = (acc[sectorName] || 0) + l.co2;
      return acc;
    }, {});

    return {
      cityId,
      totalCO2,
      sectorBreakdown,
      userCount: await User.count({ where: { cityId } })
    };
  }
};
