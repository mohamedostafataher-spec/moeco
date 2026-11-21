
/**
 * Carbon Calculation Service
 * Provides standardized emission factors and calculation logic for MoEco.
 */

export interface EmissionFactors {
  [key: string]: number; // kgCO2 per unit (km, kWh, m3, etc.)
}

export const EMISSION_FACTORS: EmissionFactors = {
  // Transport (kgCO2 per km)
  'Car': 0.18,
  'Bus': 0.08,
  'Metro': 0.03,
  'Train': 0.04,
  'Tram': 0.03,
  'Monorail': 0.03,
  'River': 0.12,
  'Uber': 0.18,
  'Careem': 0.18,
  'Walking': 0,
  'Cycling': 0,
  
  // Utilities (kgCO2 per unit)
  'Electricity': 0.5, // per kWh
  'Water': 0.3, // per m3
  'Gas': 2.1, // per m3
  
  // Other
  'Flight': 0.25, // per km
  'Waste': 0.5, // per kg
  'Shopping': 1.2, // per item (average)
};

export const carbonService = {
  calculateTransportCarbon: (distanceKm: number, mode: string): number => {
    const factor = EMISSION_FACTORS[mode] || EMISSION_FACTORS['Car'];
    return distanceKm * factor;
  },

  calculateUtilityCarbon: (value: number, type: string): number => {
    const factor = EMISSION_FACTORS[type] || 0;
    return value * factor;
  },

  calculateTotalCarbon: (entries: { value: number, type: string }[]): number => {
    return entries.reduce((acc, entry) => acc + carbonService.calculateUtilityCarbon(entry.value, entry.type), 0);
  },

  getEmissionFactor: (type: string): number => {
    return EMISSION_FACTORS[type] || 0;
  }
};
