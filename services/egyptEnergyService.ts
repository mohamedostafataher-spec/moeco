
import { storageService } from './storageService';

export interface ElectricityTier {
  min: number;
  max: number | null;
  price: number;
  serviceCharge: number;
}

export const EGYPT_ELECTRICITY_TIERS: ElectricityTier[] = [
  { min: 0, max: 50, price: 0.68, serviceCharge: 10 },
  { min: 51, max: 100, price: 0.78, serviceCharge: 20 },
  { min: 101, max: 200, price: 0.95, serviceCharge: 30 }, 
  { min: 201, max: 350, price: 1.55, serviceCharge: 45 },
  { min: 351, max: 650, price: 1.95, serviceCharge: 70 },
  { min: 651, max: 1000, price: 2.10, serviceCharge: 100 },
  { min: 1001, max: null, price: 2.58, serviceCharge: 150 }
];

export const calculateElectricityBill = (kwh: number) => {
  let cost = 0;
  let serviceCharge = 0;
  let tier = 0;

  // Official Egyptian Electricity Tariffs - Updated April 2026
  if (kwh <= 50) {
    cost = kwh * 0.68;
    serviceCharge = 10;
    tier = 1;
  } else if (kwh <= 100) {
    cost = (50 * 0.68) + ((kwh - 50) * 0.78);
    serviceCharge = 20;
    tier = 2;
  } else if (kwh <= 200) {
    cost = kwh * 0.95; 
    serviceCharge = 30;
    tier = 3;
  } else if (kwh <= 350) {
    cost = (200 * 0.95) + ((kwh - 200) * 1.55);
    serviceCharge = 45;
    tier = 4;
  } else if (kwh <= 650) {
    cost = (200 * 0.95) + (150 * 1.55) + ((kwh - 350) * 1.95);
    serviceCharge = 70;
    tier = 5;
  } else if (kwh <= 1000) {
    cost = kwh * 2.10;
    serviceCharge = 100;
    tier = 6;
  } else {
    cost = kwh * 2.58;
    serviceCharge = 150;
    tier = 7;
  }

  const total = cost + serviceCharge;

  return {
    total,
    cost: total,
    energyCost: cost,
    serviceCharge,
    tier,
    co2: kwh * 0.53
  };
};

export const calculateWaterBill = (m3: number) => {
  let cost = 0;
  let sewage = 0;
  
  // Official Egyptian Water Tariffs - April 2026 update
  // Slices: 0-10, 11-20, 21-30, 31-50, >50
  if (m3 <= 10) {
    cost = m3 * 1.25;
  } else if (m3 <= 20) {
    cost = (10 * 1.25) + ((m3 - 10) * 2.50);
  } else if (m3 <= 30) {
    cost = (10 * 1.25) + (10 * 2.50) + ((m3 - 20) * 3.50);
  } else if (m3 <= 50) {
    cost = (10 * 1.25) + (10 * 2.50) + (10 * 3.50) + ((m3 - 30) * 4.00);
  } else {
    cost = (10 * 1.25) + (10 * 2.50) + (10 * 3.50) + (20 * 4.00) + ((m3 - 50) * 4.60);
  }

  // Sewage cost is 75% of the water consumption value in Egypt
  sewage = cost * 0.75;
  
  // Fixed service and maintenance fees (average 15 EGP)
  const fixedFees = 15;
  const total = cost + sewage + fixedFees;
  
  return {
    total,
    waterCost: cost,
    sewageCost: sewage,
    fixedFees,
    co2: m3 * 0.15 // CO2 impact of water treatment is relatively low compared to electricity
  };
};

export const calculateGasBill = (m3: number, type: 'piped' | 'vehicle' | 'cylinder_home' | 'cylinder_comm' = 'piped') => {
  if (type === 'cylinder_home') return { total: 100, co2: 36 }; // 100 EGP for home cylinder (2024 price)
  if (type === 'cylinder_comm') return { total: 200, co2: 72 }; // 200 EGP for commercial
  if (type === 'vehicle') return { total: m3 * 7, co2: m3 * 1.93 }; // 7 EGP/m3 for vehicle gas

  let cost = 0;
  // Official Egyptian Natural Gas Tariffs (Domestic) - 2024
  if (m3 <= 30) {
    cost = m3 * 2.50;
  } else if (m3 <= 60) {
    cost = (30 * 2.50) + ((m3 - 30) * 3.25);
  } else {
    cost = (30 * 2.50) + (30 * 3.25) + ((m3 - 60) * 3.75);
  }

  return {
    total: cost,
    cost: cost,
    co2: m3 * 1.93
  };
};

export const egyptEnergyService = {
  calculateElectricityBill,
  calculateWaterBill,
  calculateGasBill,
  getConfig: async () => {
    const dbConfig = await storageService.getEnergyConfig();
    if (dbConfig) return dbConfig;
    
    const local = localStorage.getItem('moeco_egypt_energy_config');
    return local ? JSON.parse(local) : { 
      lastUpdated: new Date().toISOString(),
      electricity: { tiers: EGYPT_ELECTRICITY_TIERS },
      gas: { tiers: [{ min: 0, max: 30, price: 6.00 }, { min: 31, max: 60, price: 8.00 }, { min: 61, max: null, price: 12.00 }] },
      fuel: { petrol92: 12.5, petrol95: 13.5, diesel: 10.0, gasCylinderHome: 275, gasCylinderComm: 550, vehicleGas: 13 }
    };
  },
  saveConfig: async (config: any) => {
    await storageService.saveEnergyConfig(config);
    localStorage.setItem('moeco_egypt_energy_config', JSON.stringify(config));
  },
  getSavingRecommendations: (kwh: number) => {
    const recommendations = [];
    if (kwh > 200) recommendations.push({ id: 1, title: 'Switch to LED bulbs', saving: '15%' });
    if (kwh > 350) recommendations.push({ id: 2, title: 'Optimize AC usage', saving: '25%' });
    return recommendations;
  },
  predictNextBill: (kwh: number, reductionPercent: number) => {
    const reducedKwh = kwh * (1 - reductionPercent / 100);
    return calculateElectricityBill(reducedKwh);
  }
};
