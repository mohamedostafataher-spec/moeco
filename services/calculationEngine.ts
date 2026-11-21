
import { supabase } from './supabaseClient';
import { FuelIntelligenceEngine, FuelPrice } from './FuelIntelligenceEngine';

export interface CalculationResult {
  co2: number;
  points: number;
  utilityCost: number;
  totalCost: number;
  tier?: string;
  tierBreakdown?: { tier: string; consumed: number; cost: number; price: number }[];
  cleaningFee: number;
  fees: number;
  feeBreakdown: { name: string; amount: number }[];
  appliedFactor: number;
}

export const calculationEngine = {
  // --- Dynamic Cache ---
  priceTiers: [] as any[],
  emissionFactors: {} as Record<string, number>,
  fuelPrices: [] as FuelPrice[],
  isInitialized: false,
  _initPromise: null as Promise<void> | null,
  
  async init() {
    if (this.isInitialized) return;
    if (this._initPromise) return this._initPromise;

    this._initPromise = (async () => {
      try {
        addLog("Initializing Dynamic Calculation Engine...");
        
        // Use a timeout for the initialization fetches to prevent hanging the whole app
        const fetchWithTimeout = async (promise: Promise<any>, timeoutMs: number = 8000) => {
          return Promise.race([
            promise,
            new Promise((_, reject) => setTimeout(() => reject(new Error("Init Timeout")), timeoutMs))
          ]);
        };

        const [tiersRes, factorsRes, fuelRes] = await Promise.all([
          fetchWithTimeout(supabase.from('utility_tiers').select('*')).catch(() => ({ data: null, error: 'Timeout' })),
          fetchWithTimeout(supabase.from('scientific_data').select('value').eq('key', 'emission_factors').single()).catch(() => ({ data: null, error: 'Timeout' })),
          fetchWithTimeout(FuelIntelligenceEngine.getLatestPrices()).catch(() => [])
        ]) as any;

        let tiers: any[] = [];

        this.fuelPrices = fuelRes;

        if (tiersRes.data && tiersRes.data.length > 0) {
          tiers = tiersRes.data.map((p: any) => ({
            sector: p.sector, // matches db column
            min: Number(p.min) || 0,
            max: p.max ? Number(p.max) : Infinity,
            price: Number(p.price),
            carbon_factor: Number(p.carbon_factor) || (p.sector === 'gas' ? 2.1 : p.sector === 'water' ? 0.298 : 0.42),
            serviceCharge: Number(p.serviceCharge) || (p.sector === 'electricity' ? 10 : 0)
          }));
        } else {
          // Fallback to exact user-provided tiers (Egypt 2024/2026)
          tiers = [
              // Electricity (Egyptian Mixed Slab/Progressive Logic)
              { sector: 'electricity', min: 0, max: 50, price: 0.68, carbon_factor: 0.42, serviceCharge: 10 },
              { sector: 'electricity', min: 51, max: 100, price: 0.78, carbon_factor: 0.42, serviceCharge: 20 },
              { sector: 'electricity', min: 101, max: 200, price: 0.95, carbon_factor: 0.42, serviceCharge: 30 },
              { sector: 'electricity', min: 201, max: 350, price: 1.55, carbon_factor: 0.42, serviceCharge: 45 },
              { sector: 'electricity', min: 351, max: 650, price: 1.95, carbon_factor: 0.42, serviceCharge: 70 },
              { sector: 'electricity', min: 651, max: 1000, price: 2.10, carbon_factor: 0.42, serviceCharge: 100 },
              { sector: 'electricity', min: 1001, max: Infinity, price: 2.58, carbon_factor: 0.42, serviceCharge: 150 },
              
              // Gas (Progressive)
              { sector: 'gas', min: 0, max: 30, price: 2.50, carbon_factor: 2.1 },
              { sector: 'gas', min: 31, max: 60, price: 3.25, carbon_factor: 2.1 },
              { sector: 'gas', min: 61, max: Infinity, price: 3.75, carbon_factor: 2.1 },
  
              // Water (Progressive)
              { sector: 'water', min: 0, max: 10, price: 1.25, carbon_factor: 0.298 },
              { sector: 'water', min: 11, max: 20, price: 2.50, carbon_factor: 0.298 },
              { sector: 'water', min: 21, max: 30, price: 3.50, carbon_factor: 0.298 },
              { sector: 'water', min: 31, max: 50, price: 4.00, carbon_factor: 0.298 },
              { sector: 'water', min: 51, max: Infinity, price: 4.60, carbon_factor: 0.298 }
          ];
        }
  
        this.priceTiers = tiers;
  
        if (factorsRes.data) {
          this.emissionFactors = factorsRes.data.value;
        }
  
        this.isInitialized = true;
        addLog("Calculation Engine Initialized (Database or Fallback).");
      } catch (e) {
        console.error('Failed to fetch dynamic calculator data, using fallbacks:', e);
        this.isInitialized = true; // Still mark as initialized to use fallbacks
      } finally {
        this._initPromise = null;
      }
    })();
    
    return this._initPromise;
  },

  // --- Dynamic Calculation Core ---
  calculate: async (category: string, value: number, metadata: any = {}): Promise<CalculationResult> => {
    if (!calculationEngine.isInitialized) await calculationEngine.init();

    let co2 = 0;
    
    // Find carbon_factor for category
    const categoryTier = calculationEngine.priceTiers.find(t => t.sector === category);
    const baseFactor = categoryTier?.carbon_factor || 0.42; // Fallback to Egypt Electricity Avg
    
    let appliedFactor = baseFactor;
    
    // Fallback for non-utility
    if (['electricity', 'gas', 'water'].indexOf(category) === -1) {
      const factors = calculationEngine.emissionFactors || {};
      let categoryKey = category;
      if (category === 'transport') {
        categoryKey = metadata.mode || metadata.transport?.type || 'car_small';
      } else if (category === 'food') {
        categoryKey = metadata.foodType || 'food_veg';
      }
      
      // Attempt to load proper dynamic factor from database
      appliedFactor = factors[categoryKey] || factors[category] || (category === 'transport' ? 0.18 : category === 'food' ? 2.5 : 0.5); 
      co2 = value * appliedFactor;
      
      return {
        co2,
        points: Math.round(co2 / 0.5),
        utilityCost: 0,
        totalCost: category === 'transport' ? (value * 0.1 * 22.25) : (category === 'food' ? value * 120 : value * 300),
        appliedFactor: appliedFactor,
        cleaningFee: 0,
        fees: 0,
        feeBreakdown: [],
        tier: 'N/A'
      };
    }

    co2 = value * appliedFactor;

    // 2. Determine Cost & Tier
    let cost = 0;
    let tierName = "N/A";
    let fees = 0;
    let feeBreakdown: { name: string; amount: number }[] = [];
    let tierBreakdown: { tier: string; consumed: number; cost: number; price: number }[] = [];

    if (['electricity', 'gas', 'water'].includes(category)) {
      let remaining = value;
      
      const categoryTiers = calculationEngine.priceTiers
        .filter(t => t.sector === category)
        .sort((a,b) => a.min - b.min);
      
      let highestTierReached = '';
      let isEgyptianSlabLogic = category === 'electricity' && value > 650;

      if (isEgyptianSlabLogic) {
        // Egyptian Slab Logic: Above 650, you pay flat for whole usage
        const effectiveTier = categoryTiers.find(t => value >= t.min && value <= t.max) || categoryTiers[categoryTiers.length - 1];
        cost = value * effectiveTier.price;
        tierName = `Tier: ${effectiveTier.min}-${effectiveTier.max === Infinity ? '+' : effectiveTier.max}`;
        tierBreakdown.push({
          tier: tierName,
          consumed: value,
          cost: cost,
          price: effectiveTier.price
        });
        fees = effectiveTier.serviceCharge || 0;
        feeBreakdown.push({ name: 'Service Charge', amount: fees });
      } else {
        // Normal Progressive Logic
        for (let tier of categoryTiers) {
          let range = tier.max - tier.min;
          let used = Math.min(remaining, range);
          
          if (used > 0) {
            const tierCost = used * tier.price;
            cost += tierCost;
            const tierLabel = `Tier: ${tier.min}-${tier.max === Infinity ? '+' : tier.max}`;
            highestTierReached = tierLabel;
            tierBreakdown.push({
              tier: tierLabel,
              consumed: used,
              cost: tierCost,
              price: tier.price
            });
            remaining -= used;
          }
          
          if (remaining <= 0) {
            fees = tier.serviceCharge || 0;
            break;
          }
        }
        tierName = highestTierReached || 'No Consumption';
        if (fees > 0) feeBreakdown.push({ name: 'Service Charge', amount: fees });
      }
      
      // Additional Egyptian Fees
      if (category === 'electricity') {
        feeBreakdown.push({ name: 'Cleaning Fee', amount: 10 });
        fees += 10;
      } else if (category === 'water') {
        const sewage = cost * 0.75;
        feeBreakdown.push({ name: 'Sewage Fee (75%)', amount: sewage });
        fees += sewage;
      }
    } else {
        // Non-utility fallbacks
        if (category === 'transport') {
          const fuelType = metadata.fuelType || 'benzine_92';
          const fuelPrice = calculationEngine.fuelPrices.find(f => f.fuel_type === fuelType)?.price || 22.25;
          const consumptionPerKm = metadata.consumptionPerKm || 0.1; // 10 liters per 100km default
          cost = value * consumptionPerKm * fuelPrice;
        }
        if (category === 'food') cost = value * 120;
        if (category === 'shopping') cost = value * 300;
    }

    fees = feeBreakdown.reduce((sum, f) => sum + f.amount, 0);
    const cleaningFeeObj = feeBreakdown.find(f => f.name === 'Cleaning Fee');
    const cleaningFee = cleaningFeeObj ? cleaningFeeObj.amount : 0;
    
    let totalCost = cost + fees;
    const points = Math.round(co2 / 0.5); // 1 point per 0.5kg saved (as per directive logic)

    return {
      co2,
      points,
      utilityCost: Math.round(cost * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      tier: tierName,
      tierBreakdown,
      cleaningFee,
      fees,
      feeBreakdown,
      appliedFactor
    };
  },

  // --- Legacy Compatibility Wrappers ---
  calculateCarbon: async (sector: string, val: number) => {
    return calculationEngine.calculate(sector, val);
  },
  calculateTransport: async (mode: string, dist: number) => {
    return calculationEngine.calculate('transport', dist, { mode });
  },
  calculateBaseline: (data: any) => {
    const carFactor = data.carType === 'none' ? 0 : data.carType === 'small' ? 1500 : 3000;
    const houseFactor = data.houseSize === 'small' ? 2000 : data.houseSize === 'medium' ? 4000 : 7000;
    return carFactor + houseFactor;
  },
  getEcoLevel: (points: number, lang: 'ar' | 'en') => {
    if (points >= 5000) return { level: lang === 'ar' ? 'غابة' : 'Forest', badge: '🌳', nextLevel: 10000 };
    if (points >= 2000) return { level: lang === 'ar' ? 'شجرة' : 'Tree', badge: '🌲', nextLevel: 5000 };
    if (points >= 500) return { level: lang === 'ar' ? 'برعم' : 'Sprout', badge: '🌱', nextLevel: 2000 };
    return { level: lang === 'ar' ? 'بذرة' : 'Seed', badge: '🌰', nextLevel: 500 };
  },

  getSmartAdvice: (sector: string, consumption: number, language: 'ar' | 'en'): string => {
    // Logic preserved for UI insights
    if (language === 'ar') {
      if (sector === 'electricity' && consumption > 300) return "استهلاكك للكهرباء مرتفع. حاول تقليل استخدام التكييف واستخدام لمبات LED لتوفير حوالي 200 جنيه شهرياً.";
      if (sector === 'water' && consumption > 30) return "استهلاكك للمياه يتجاوز المتوسط. تأكد من إصلاح أي تسريبات لتجنب غرامات الشريحة العالية.";
      return "أداؤك البيئي المالي ممتاز، أنت توفر المال وتحمي الكوكب.";
    } else {
      if (sector === 'electricity' && consumption > 300) return "Your electricity usage is high. Try reducing AC usage and switching to LED bulbs to save ~200 EGP/month.";
      if (sector === 'water' && consumption > 30) return "Your water usage is above average. Check for leaks to avoid high-tier penalties.";
      return "Your environmental financial performance is excellent, you're saving money and the planet.";
    }
  }
};

const addLog = (msg: string) => { console.log(`[CalcEngine] ${msg}`); };

