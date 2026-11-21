
import { supabase } from './supabaseClient';

export type UtilityType = 'electricity' | 'water' | 'gas';

export interface BillRecord {
  id?: string;
  user_id: string;
  type: UtilityType;
  previous_reading: number;
  current_reading: number;
  consumption: number;
  cost: number;
  created_at?: string;
}

export const billingService = {
  // Calculate Electricity Bill (Egyptian Tariffs 2024/2025)
  calculateElectricity: (kwh: number): { cost: number; slab: string } => {
    let cost = 0;
    let slab = '';

    if (kwh <= 50) {
      cost = kwh * 0.68;
      slab = '1 (0-50)';
    } else if (kwh <= 100) {
      cost = kwh * 0.78;
      slab = '2 (51-100)';
    } else if (kwh <= 200) {
      cost = kwh * 0.95;
      slab = '3 (0-200)';
    } else if (kwh <= 350) {
      cost = kwh * 1.55;
      slab = '4 (201-350)';
    } else if (kwh <= 650) {
      cost = kwh * 1.65;
      slab = '5 (351-650)';
    } else if (kwh <= 1000) {
      cost = kwh * 2.10;
      slab = '6 (651-1000)';
    } else {
      cost = kwh * 2.23;
      slab = '7 (1000+)';
    }

    // Add fixed customer service fees (approximate)
    cost += 10; 
    return { cost: Number(cost.toFixed(2)), slab };
  },

  // Calculate Water Bill (Egyptian Tariffs)
  calculateWater: (m3: number): { cost: number; slab: string } => {
    let cost = 0;
    let slab = '';

    if (m3 <= 10) {
      cost = m3 * 1.25;
      slab = '1 (0-10)';
    } else if (m3 <= 20) {
      cost = m3 * 2.50;
      slab = '2 (11-20)';
    } else if (m3 <= 30) {
      cost = m3 * 3.50;
      slab = '3 (21-30)';
    } else if (m3 <= 40) {
      cost = m3 * 4.00;
      slab = '4 (31-40)';
    } else {
      cost = m3 * 4.60;
      slab = '5 (40+)';
    }

    // Add sewage fees (75% of water cost)
    cost = cost * 1.75;
    return { cost: Number(cost.toFixed(2)), slab };
  },

  // Calculate Gas Bill (Egyptian Tariffs)
  calculateGas: (m3: number): { cost: number; slab: string } => {
    let cost = 0;
    let slab = '';

    if (m3 <= 30) {
      cost = m3 * 2.50;
      slab = '1 (0-30)';
    } else if (m3 <= 60) {
      cost = m3 * 3.25;
      slab = '2 (31-60)';
    } else {
      cost = m3 * 3.75;
      slab = '3 (60+)';
    }

    return { cost: Number(cost.toFixed(2)), slab };
  },

  // Prediction Logic
  predictMonthlyBill: (currentUsage: number, daysPassed: number): number => {
    if (daysPassed <= 0) return 0;
    return (currentUsage * 30) / daysPassed;
  },

  // Smart Insights Logic
  getInsights: (consumption: number, type: UtilityType, isRtl: boolean) => {
    const thresholds = {
      electricity: 300,
      water: 25,
      gas: 40
    };

    if (consumption > thresholds[type]) {
      return {
        message: isRtl ? 'استهلاكك أعلى من الطبيعي. يمكنك التوفير بنسبة 20% باتباع نصائحنا.' : 'Your consumption is higher than average. You can save 20% by following our tips.',
        status: 'high'
      };
    } else {
      return {
        message: isRtl ? 'أداء ممتاز! استهلاكك ضمن الحدود المثالية.' : 'Excellent performance! Your consumption is within ideal limits.',
        status: 'good'
      };
    }
  },

  // Supabase Actions
  saveBill: async (bill: BillRecord) => {
    const { data, error } = await supabase
      .from('bills')
      .insert([bill])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  getHistory: async (userId: string, type?: UtilityType) => {
    let query = supabase
      .from('bills')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Reward System Logic
  checkRewards: async (userId: string, currentConsumption: number, type: UtilityType) => {
    const history = await billingService.getHistory(userId, type);
    if (history.length < 2) return null;

    const previousBill = history[1]; // The one before the current insert
    if (currentConsumption < previousBill.consumption) {
      const pointsEarned = Math.floor((previousBill.consumption - currentConsumption) * 10);
      
      // Update user points
      const { data: currentPoints } = await supabase
        .from('user_rewards')
        .select('points')
        .eq('user_id', userId)
        .single();
      
      const newPoints = (currentPoints?.points || 0) + pointsEarned;
      
      await supabase
        .from('user_rewards')
        .upsert({ user_id: userId, points: newPoints, last_updated: new Date().toISOString() });

      return {
        points: pointsEarned,
        coupon: pointsEarned > 50 ? 'ECO-SAVER-20' : null
      };
    }
    return null;
  }
};
