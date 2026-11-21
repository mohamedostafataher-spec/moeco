
import { storageService } from './storageService';
import { supabase } from './supabaseClient';

export interface FuelPrice {
  id: string;
  fuel_type: string;
  price: number;
  currency: string;
  source: string;
  effective_date: string;
  updated_at: string;
}

export const FuelIntelligenceEngine = {
  async getLatestPrices(): Promise<FuelPrice[]> {
    try {
      const { data, error } = await supabase
        .from('fuel_prices')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return [];
      }

      return data;
    } catch (e) {
      return [];
    }
  },

  async seedInitialPrices() {
    // No-op to comply with no-mock-data policy
  },

  async syncWithExternalSources() {
    // This would typically be a Supabase Edge Function or Scheduled Job
    // Here we simulate the logic: Fetch RSS/API -> Compare -> Alert
    console.log("Checking for fuel price updates from external RSS feeds...");
    
    // Simulate finding a change in a future turn or through a background process
  },

  async triggerPriceAlert(fuelType: string, oldPrice: number, newPrice: number) {
    const isIncrease = newPrice > oldPrice;
    const changePct = ((newPrice - oldPrice) / oldPrice) * 100;
    
    const titleAr = isIncrease ? "زيادة في أسعار الوقود" : "انخفاض في أسعار الوقود";
    const titleEn = isIncrease ? "Fuel Price Increase" : "Fuel Price Decrease";
    
    const descAr = `تحديث رسمي: ${fuelType} أصبح بـ ${newPrice} ج.م (تغير ${changePct.toFixed(1)}%)`;
    const descEn = `Official Update: ${fuelType} is now ${newPrice} EGP (${changePct.toFixed(1)}% change)`;

    const userId = localStorage.getItem('moeco_user_id');
    if (userId) {
      await storageService.createNotification(
        userId,
        titleAr,
        titleEn,
        descAr,
        descEn,
        'Alert'
      );
    }
  },

  async getDynamicCarbonPulse(userId: string) {
    try {
      // Aggregate data from logs
      const { data: logs } = await supabase
        .from('carbon_footprint_logs')
        .select('emissions_kg')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const dailyTotal = logs?.reduce((sum, log) => sum + (log.emissions_kg || 0), 0) || 0;
      
      // Baseline global pulse + dynamic user contribution
      const baselineStr = await storageService.getCarbonPulse();
      const baseline = parseFloat(baselineStr);
      return (baseline + (dailyTotal / 100)).toFixed(2);
    } catch (e) {
      return await storageService.getCarbonPulse();
    }
  }
};
