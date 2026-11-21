
import type { Request, Response } from 'express';
import type { AuthRequest } from '../middleware/auth.ts';
import ConsumptionLog from '../models/ConsumptionLog.ts';
import AuditLog from '../models/AuditLog.ts';
import Sector from '../models/Sector.ts';
import City from '../models/City.ts';
import Country from '../models/Country.ts';
import { CarbonEngine } from '../services/CarbonEngine.ts';
import { ForecastingEngine } from '../services/ForecastingEngine.ts';
import { AlertEngine } from '../services/AlertEngine.ts';
import { ReportingEngine } from '../services/ReportingEngine.ts';
import { EstimationEngine } from '../services/EstimationEngine.ts';
import { ExportService } from '../services/ExportService.ts';

export const addLog = async (req: AuthRequest, res: Response) => {
  try {
    const { sectorId, cityId, countryId, consumption, unit, cost, currency, status, method, methodAr } = req.body;
    const userId = req.user!.id;

    // 1. Calculate CO2 using the central Carbon Engine
    const co2 = await CarbonEngine.calculateEmissions(consumption, sectorId, countryId);

    // 2. Create the log entry
    const log = await ConsumptionLog.create({
      userId,
      sectorId,
      cityId,
      countryId,
      consumption,
      unit,
      cost,
      currency,
      co2,
      status: status || 'Actual',
      method: method || 'Direct meter reading',
      methodAr: methodAr || 'قراءة العداد المباشرة'
    });

    // 3. Log the action for audit
    await AuditLog.create({
      userId,
      action: 'ADD_CONSUMPTION_LOG',
      details: `Added log for sector ${sectorId}: ${consumption} ${unit}`,
      ipAddress: req.ip
    });

    // 4. Trigger the Alert Engine to check for anomalies or trends
    await AlertEngine.checkAlerts(userId, sectorId, countryId);

    res.status(201).json(log);
  } catch (error) {
    console.error('Error adding log:', error);
    res.status(500).json({ error: 'Failed to add log' });
  }
};

export const estimateConsumption = async (req: AuthRequest, res: Response) => {
  try {
    const { sectorId, countryId, householdMembers, rooms, areaType, meterReading } = req.body;
    const month = new Date().getMonth() + 1;
    
    const result = await EstimationEngine.estimate({
      sectorId,
      countryId,
      householdMembers,
      rooms,
      areaType,
      meterReading,
      month
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to estimate consumption' });
  }
};

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const logs = await AuditLog.findAll({
      order: [['timestamp', 'DESC']],
      limit: 100
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
};

export const getTransparencyInfo = async (req: Request, res: Response) => {
  const info = [
    {
      sector: 'Electricity',
      methodEn: 'Tiered Pricing + Seasonal Adjustment',
      methodAr: 'نظام الشرائح + التعديل الموسمي',
      formulaEn: 'Consumption * TierPrice * SeasonalFactor',
      formulaAr: 'الاستهلاك * سعر الشريحة * المعامل الموسمي',
      sourceEn: 'Egypt Ministry of Electricity',
      sourceAr: 'وزارة الكهرباء والطاقة المتجددة',
      errorMargin: '±2%'
    },
    {
      sector: 'Water',
      methodEn: 'Volumetric Consumption + Fixed Service Charge',
      methodAr: 'الاستهلاك الحجمي + رسوم الخدمة الثابتة',
      formulaEn: '(Consumption * TierPrice) + ServiceCharge',
      formulaAr: '(الاستهلاك * سعر الشريحة) + رسوم الخدمة',
      sourceEn: 'Holding Company for Water and Wastewater',
      sourceAr: 'الشركة القابضة لمياه الشرب والصرف الصحي',
      errorMargin: '±1.5%'
    }
  ];
  res.json(info);
};

export const exportLogs = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const buffer = await ExportService.generateExcelReport({ userId });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=MoEco_Report.xlsx');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export logs' });
  }
};

export const getLogs = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const logs = await ConsumptionLog.findAll({ 
      where: { userId }, 
      order: [['timestamp', 'DESC']],
      include: [Sector, City, Country]
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
};

export const getGovAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const countryId = req.user!.countryId;
    const logs = await ConsumptionLog.findAll({ 
      where: { countryId },
      include: [Sector, City]
    });
    
    // Aggregation logic
    const totalCO2 = logs.reduce((sum, l) => sum + l.co2, 0);
    const totalUsers = new Set(logs.map(l => l.userId)).size;

    // Sector breakdown
    const sectorBreakdown = logs.reduce((acc: any, l: any) => {
      const sectorName = l.Sector.nameEn;
      acc[sectorName] = (acc[sectorName] || 0) + l.co2;
      return acc;
    }, {});

    // City breakdown
    const cityBreakdown = logs.reduce((acc: any, l: any) => {
      const cityName = l.City.nameEn;
      acc[cityName] = (acc[cityName] || 0) + l.co2;
      return acc;
    }, {});

    res.json({
      totalCO2,
      totalUsers,
      recordsCount: logs.length,
      sectorBreakdown,
      cityBreakdown,
      countryId
    });
  } catch (error) {
    console.error('Error fetching gov analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

export const getMonthlyData = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { month, year } = req.query;
    const m = month ? parseInt(month as string) : new Date().getMonth();
    const y = year ? parseInt(year as string) : new Date().getFullYear();
    
    const report = await ReportingEngine.generateCitizenMonthlyReport(userId, m, y);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch monthly data' });
  }
};

export const getYearlyData = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
    
    const logs = await ConsumptionLog.findAll({
      where: { 
        userId,
        timestamp: {
          [Symbol.for('gte')]: new Date(year, 0, 1),
          [Symbol.for('lt')]: new Date(year + 1, 0, 1)
        }
      }
    });

    const monthlyBreakdown = Array(12).fill(0);
    logs.forEach(l => {
      const m = new Date(l.timestamp).getMonth();
      monthlyBreakdown[m] += l.co2;
    });

    res.json({ year, monthlyBreakdown, totalCO2: logs.reduce((a, b) => a + b.co2, 0) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch yearly data' });
  }
};

export const getFutureForecasts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const logs = await ConsumptionLog.findAll({ 
      where: { userId },
      order: [['timestamp', 'ASC']]
    });

    if (logs.length < 3) {
      return res.json({ message: 'Not enough data for forecasting', forecast: [] });
    }

    const values = logs.map(l => l.co2);
    const forecast = ForecastingEngine.linearRegression(values, 3);
    
    res.json({ forecast });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate forecast' });
  }
};

export const getCityReport = async (req: AuthRequest, res: Response) => {
  try {
    const { cityId } = req.params;
    const report = await ReportingEngine.generateCitySustainabilityReport(cityId as string);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch city report' });
  }
};

export const getCityIndicators = async (req: AuthRequest, res: Response) => {
  try {
    const { cityId } = req.params;
    const logs = await ConsumptionLog.findAll({ where: { cityId }, include: [Sector] });
    
    const indicators = logs.reduce((acc: any, l: any) => {
      const sector = l.Sector.nameEn;
      if (!acc[sector]) acc[sector] = { total: 0, count: 0 };
      acc[sector].total += l.co2;
      acc[sector].count += 1;
      return acc;
    }, {});

    res.json(indicators);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch city indicators' });
  }
};

export const getSectorAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const countryId = req.user!.countryId;
    const logs = await ConsumptionLog.findAll({ 
      where: { countryId },
      include: [Sector]
    });

    const sectorStats = logs.reduce((acc: any, l: any) => {
      const sector = l.Sector.nameEn;
      if (!acc[sector]) acc[sector] = { name: sector, value: 0 };
      acc[sector].value += l.co2;
      return acc;
    }, {});

    res.json(Object.values(sectorStats));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sector analytics' });
  }
};
