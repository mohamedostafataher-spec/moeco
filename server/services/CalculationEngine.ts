
/**
 * Calculation Engine
 * Handles carbon emissions, energy usage, and cost calculations.
 */

export interface CalculationInput {
  type: 'transport' | 'electricity' | 'water' | 'gas' | 'food' | 'waste';
  value: number;
  unit?: string;
  details?: any;
}

export interface CalculationResult {
  emissions: number; // kg CO2
  energy_usage: number; // kWh or equivalent
  cost: number; // EGP
}

export const CalculationEngine = {
  calculate: (input: CalculationInput): CalculationResult => {
    switch (input.type) {
      case 'transport':
        return CalculationEngine.calculateTransport(input.value, input.details);
      case 'electricity':
        return CalculationEngine.calculateElectricity(input.value);
      case 'water':
        return CalculationEngine.calculateWater(input.value);
      case 'gas':
        return CalculationEngine.calculateGas(input.value);
      case 'food':
        return CalculationEngine.calculateFood(input.value, input.details);
      case 'waste':
        return CalculationEngine.calculateWaste(input.value, input.details);
      default:
        return { emissions: 0, energy_usage: 0, cost: 0 };
    }
  },

  calculateTransport: (distance: number, details: any): CalculationResult => {
    // details: { vehicleType: 'car' | 'bus' | 'train' | 'bike', fuelType: 'petrol' | 'diesel' | 'electric' }
    const factors: any = {
      car: { emissions: 0.17, energy: 0.8, cost: 3.5 }, // per km
      bus: { emissions: 0.08, energy: 0.4, cost: 1.5 },
      train: { emissions: 0.04, energy: 0.2, cost: 2.0 },
      bike: { emissions: 0, energy: 0, cost: 0 },
      walking: { emissions: 0, energy: 0, cost: 0 }
    };

    const factor = factors[details?.vehicleType] || factors.car;
    return {
      emissions: distance * factor.emissions,
      energy_usage: distance * factor.energy,
      cost: distance * factor.cost
    };
  },

  calculateElectricity: (kwh: number): CalculationResult => {
    // Egypt Electricity Tiers (Approximate for 2024/2025)
    let cost = 0;
    if (kwh <= 50) cost = kwh * 0.68;
    else if (kwh <= 100) cost = 50 * 0.68 + (kwh - 50) * 0.78;
    else if (kwh <= 200) cost = kwh * 1.06;
    else if (kwh <= 350) cost = 200 * 1.06 + (kwh - 200) * 1.28;
    else if (kwh <= 650) cost = 350 * 1.28 + (kwh - 350) * 1.48;
    else if (kwh <= 1000) cost = kwh * 2.10;
    else cost = kwh * 2.30;

    return {
      emissions: kwh * 0.5, // 0.5 kg CO2 per kWh (Egypt average)
      energy_usage: kwh,
      cost: cost
    };
  },

  calculateWater: (m3: number): CalculationResult => {
    // Egypt Water Tiers
    let cost = 0;
    if (m3 <= 10) cost = m3 * 1.25;
    else if (m3 <= 20) cost = 10 * 1.25 + (m3 - 10) * 2.50;
    else if (m3 <= 30) cost = 10 * 1.25 + 10 * 2.50 + (m3 - 20) * 3.50;
    else cost = m3 * 5.00;

    return {
      emissions: m3 * 0.3, // 0.3 kg CO2 per m3 (pumping/treatment)
      energy_usage: m3 * 0.5, // 0.5 kWh per m3
      cost: cost
    };
  },

  calculateGas: (m3: number): CalculationResult => {
    // Egypt Gas Tiers
    let cost = 0;
    if (m3 <= 30) cost = m3 * 2.50;
    else if (m3 <= 60) cost = 30 * 2.50 + (m3 - 30) * 3.25;
    else cost = 30 * 2.50 + 30 * 3.25 + (m3 - 60) * 3.75;

    return {
      emissions: m3 * 2.0, // 2.0 kg CO2 per m3
      energy_usage: m3 * 10.5, // 10.5 kWh per m3
      cost: cost
    };
  },

  calculateFood: (servings: number, details: any): CalculationResult => {
    // details: { dietType: 'vegan' | 'vegetarian' | 'meat_heavy' | 'balanced' }
    const factors: any = {
      vegan: { emissions: 0.5, cost: 40 },
      vegetarian: { emissions: 0.8, cost: 50 },
      balanced: { emissions: 1.5, cost: 80 },
      meat_heavy: { emissions: 3.0, cost: 150 }
    };

    const factor = factors[details?.dietType] || factors.balanced;
    return {
      emissions: servings * factor.emissions,
      energy_usage: servings * 2, // Estimated energy for prep
      cost: servings * factor.cost
    };
  },

  calculateWaste: (kg: number, details: any): CalculationResult => {
    // details: { wasteType: 'organic' | 'plastic' | 'paper' | 'metal' }
    const factors: any = {
      organic: 0.5,
      plastic: 2.5,
      paper: 1.2,
      metal: 3.0,
      mixed: 1.5
    };

    const factor = factors[details?.wasteType] || factors.mixed;
    return {
      emissions: kg * factor,
      energy_usage: 0,
      cost: 0
    };
  }
};
