
export interface AppConfig {
  emissionFactors: {
    electricity: number; // kg CO2 per kWh
    water: number;       // kg CO2 per m3
    gas: number;         // kg CO2 per m3
    transport: {
      car: number;       // kg CO2 per km
      bus: number;       // kg CO2 per km
      train: number;     // kg CO2 per km
      walking: number;   // kg CO2 per km (0)
    };
  };
  alertThresholds: {
    highConsumption: number; // % above average
    criticalStress: number;  // 0-100
  };
  walkingFactor: number; // steps per km
  pricing: {
    electricityTier1: number; // EGP per kWh
    electricityTier2: number;
    waterTier1: number;       // EGP per m3
  };
  freeMode: boolean;
  maxUsersBaseline: number;
}

const DEFAULT_CONFIG: AppConfig = {
  emissionFactors: {
    electricity: 0.53,
    water: 0.3,
    gas: 2.1,
    transport: {
      car: 0.18,
      bus: 0.08,
      train: 0.04,
      walking: 0
    }
  },
  alertThresholds: {
    highConsumption: 25,
    criticalStress: 80
  },
  walkingFactor: 1300,
  pricing: {
    electricityTier1: 0.48,
    electricityTier2: 0.58,
    waterTier1: 0.65
  },
  freeMode: true,
  maxUsersBaseline: 100000
};

export const ConfigService = {
  config: { ...DEFAULT_CONFIG },

  load: () => {
    const saved = localStorage.getItem('moeco_app_config');
    if (saved) {
      ConfigService.config = { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    }
    return ConfigService.config;
  },

  save: (newConfig: Partial<AppConfig>) => {
    ConfigService.config = { ...ConfigService.config, ...newConfig };
    localStorage.setItem('moeco_app_config', JSON.stringify(ConfigService.config));
  },

  reset: () => {
    ConfigService.config = { ...DEFAULT_CONFIG };
    localStorage.removeItem('moeco_app_config');
  }
};
