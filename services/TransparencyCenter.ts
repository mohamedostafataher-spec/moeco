
import { SectorType } from '../types';

export interface PricingTier {
  min: number;
  max: number;
  price: number;
  unit: string;
}

export interface TransparencyInfo {
  sector: SectorType;
  methodAr: string;
  methodEn: string;
  formulaAr: string;
  formulaEn: string;
  sourceAr: string;
  sourceEn: string;
  sourceUrl: string;
  lastUpdate: string;
  errorMargin: string;
}

export const TransparencyCenter = {
  pricing: {
    Electricity: [
      { min: 0, max: 50, price: 0.48, unit: 'kWh' },
      { min: 51, max: 100, price: 0.58, unit: 'kWh' },
      { min: 0, max: 200, price: 0.77, unit: 'kWh' },
    ],
    Water: [
      { min: 0, max: 10, price: 0.65, unit: 'm3' },
      { min: 11, max: 20, price: 1.60, unit: 'm3' },
    ],
    Gas: [
      { min: 0, max: 30, price: 2.35, unit: 'm3' },
      { min: 31, max: 60, price: 3.10, unit: 'm3' },
    ]
  } as Record<string, PricingTier[]>,

  info: [
    {
      sector: 'Electricity',
      methodAr: 'قراءة العداد أو التقدير بناءً على الأجهزة والمساحة',
      methodEn: 'Meter reading or estimation based on appliances and area',
      formulaAr: 'الاستهلاك (كيلوواط ساعة) × معامل الانبعاث (0.533)',
      formulaEn: 'Consumption (kWh) × Emission Factor (0.533)',
      sourceAr: 'الشركة القابضة لكهرباء مصر / IPCC',
      sourceEn: 'EEHC / IPCC',
      sourceUrl: 'http://www.eehc.gov.eg',
      lastUpdate: '2026-01-15',
      errorMargin: '±5% (Actual) / ±15% (Estimated)'
    },
    {
      sector: 'Water',
      methodAr: 'قراءة العداد أو التقدير بناءً على عدد أفراد الأسرة',
      methodEn: 'Meter reading or estimation based on household size',
      formulaAr: 'الاستهلاك (متر مكعب) × معامل الانبعاث (0.298)',
      formulaEn: 'Consumption (m3) × Emission Factor (0.298)',
      sourceAr: 'الشركة القابضة لمياه الشرب والصرف الصحي',
      sourceEn: 'HCWW',
      sourceUrl: 'https://www.hcww.com.eg',
      lastUpdate: '2025-12-10',
      errorMargin: '±3% (Actual) / ±20% (Estimated)'
    },
    {
      sector: 'Gas',
      methodAr: 'قراءة العداد أو التقدير بناءً على الاستخدام المنزلي',
      methodEn: 'Meter reading or estimation based on domestic usage',
      formulaAr: 'الاستهلاك (متر مكعب) × معامل الانبعاث (2.02)',
      formulaEn: 'Consumption (m3) × Emission Factor (2.02)',
      sourceAr: 'شركة إيجاس / IPCC',
      sourceEn: 'EGAS / IPCC',
      sourceUrl: 'http://www.egas.com.eg',
      lastUpdate: '2026-02-01',
      errorMargin: '±2% (Actual) / ±10% (Estimated)'
    }
  ] as TransparencyInfo[],

  getPricingTable: (sector: string) => TransparencyCenter.pricing[sector] || [],
  
  getCalculationFormula: (sector: SectorType, lang: 'ar' | 'en') => {
    const item = TransparencyCenter.info.find(i => i.sector === sector);
    return lang === 'ar' ? item?.formulaAr : item?.formulaEn;
  },

  getDataSource: (sector: SectorType, lang: 'ar' | 'en') => {
    const item = TransparencyCenter.info.find(i => i.sector === sector);
    return {
      name: lang === 'ar' ? item?.sourceAr : item?.sourceEn,
      url: item?.sourceUrl
    };
  },

  getLastUpdate: (sector: SectorType) => {
    return TransparencyCenter.info.find(i => i.sector === sector)?.lastUpdate;
  },

  getErrorMargin: (sector: SectorType) => {
    return TransparencyCenter.info.find(i => i.sector === sector)?.errorMargin;
  },

  getInfo: (sector: SectorType) => {
    return TransparencyCenter.info.find(i => i.sector === sector);
  }
};
