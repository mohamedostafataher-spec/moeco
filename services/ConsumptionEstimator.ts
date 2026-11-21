
import { SectorType } from '../types';

export interface EstimationInput {
  sector: SectorType;
  meterReading?: number;
  householdMembers: number;
  rooms: number;
  appliances?: string[];
  buildingTotalConsumption?: number;
  areaType: 'formal' | 'informal';
  month: number;
}

export interface EstimationResult {
  consumption: number;
  status: 'Actual' | 'Estimated - Shared' | 'Estimated - Informal' | 'Estimated - Average';
  method: string;
  methodAr: string;
}

export const ConsumptionEstimator = {
  seasonalFactor: (sector: SectorType, month: number) => {
    // Summer (June-August) boost for electricity (ACs) and water
    const isSummer = month >= 5 && month <= 7;
    const isWinter = month >= 11 || month <= 1;

    if (sector === 'Electricity') {
      return isSummer ? 1.4 : isWinter ? 1.1 : 1.0;
    }
    if (sector === 'Water') {
      return isSummer ? 1.2 : 1.0;
    }
    if (sector === 'Gas') {
      return isWinter ? 1.3 : 1.0; // More hot water usage in winter
    }
    return 1.0;
  },

  estimateBasedOnBuilding: (total: number, members: number, rooms: number) => {
    // Simple allocation: 60% based on members, 40% based on rooms (proxy for size)
    const memberWeight = 0.6;
    const roomWeight = 0.4;
    
    // Assume average building has 20 members and 15 rooms for normalization
    const avgMembers = 20;
    const avgRooms = 15;
    
    return (total * memberWeight * (members / avgMembers)) + (total * roomWeight * (rooms / avgRooms));
  },

  estimateBasedOnAverage: (sector: SectorType, areaType: 'formal' | 'informal', members: number) => {
    // Basic daily averages per person in Egypt (estimated)
    const averages = {
      Electricity: areaType === 'formal' ? 150 : 100, // kWh per month per person
      Water: areaType === 'formal' ? 6 : 4, // m3 per month per person
      Gas: areaType === 'formal' ? 15 : 10, // m3 per month per person
    };
    
    return (averages[sector as keyof typeof averages] || 0) * members;
  },

  estimate: (input: EstimationInput): EstimationResult => {
    let consumption = 0;
    let status: EstimationResult['status'] = 'Actual';
    let method = '';
    let methodAr = '';

    // Case 1: User has meter
    if (input.meterReading !== undefined && input.meterReading > 0) {
      consumption = input.meterReading;
      status = 'Actual';
      method = 'Direct meter reading';
      methodAr = 'قراءة العداد المباشرة';
    }
    // Case 2: User has no meter but in formal building with shared meter
    else if (input.buildingTotalConsumption !== undefined && input.buildingTotalConsumption > 0) {
      consumption = ConsumptionEstimator.estimateBasedOnBuilding(
        input.buildingTotalConsumption, 
        input.householdMembers, 
        input.rooms
      );
      status = 'Estimated - Shared';
      method = 'Proportional building allocation';
      methodAr = 'توزيع تناسبي بناءً على استهلاك المبنى';
    }
    // Case 3: User has no meter, informal area or fallback
    else {
      consumption = ConsumptionEstimator.estimateBasedOnAverage(
        input.sector, 
        input.areaType, 
        input.householdMembers
      );
      status = input.areaType === 'informal' ? 'Estimated - Informal' : 'Estimated - Average';
      method = `Regional average for ${input.areaType} areas`;
      methodAr = `متوسط المنطقة للمناطق ${input.areaType === 'informal' ? 'غير الرسمية' : 'الرسمية'}`;
    }

    // Apply seasonal factors
    const factor = ConsumptionEstimator.seasonalFactor(input.sector, input.month);
    consumption *= factor;

    return {
      consumption: Math.round(consumption * 100) / 100,
      status,
      method,
      methodAr
    };
  }
};
