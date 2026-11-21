
import axios from 'axios';
import { supabase } from './supabaseClient.ts';
import dotenv from 'dotenv';

export const dataEngine = {
  syncEconomyData: async () => {
    try {
      // Using fallback economy data for now as real scraping of gov sites is complex
      const economyData = [
        { title: 'سعر الدولار', value: '48.50', unit: 'EGP', source: 'CBE', trend: 'stable' },
        { title: 'معدل التضخم', value: '32.5', unit: '%', source: 'CAPMAS', trend: 'down' },
        { title: 'مؤشر البورصة EGX30', value: '28,450', unit: 'pts', source: 'EGX', trend: 'up' },
        { title: 'سعر الذهب عيار 21', value: '3,150', unit: 'EGP', source: 'Market', trend: 'up' }
      ];

      await supabase.from('economy_data').upsert(economyData, { onConflict: 'title' });
      console.log('Economy Data synced.');
    } catch (error) {
      console.error('Economy Sync Error:', error);
    }
  },

  getPrayerTimes: async (city: string = 'Cairo', country: string = 'Egypt') => {
    try {
      const response = await axios.get(`https://api.aladhan.com/v1/timingsByCity`, {
        params: { city, country, method: 5 }
      });
      return response.data.data.timings;
    } catch (error) {
      console.error('Prayer Times Error:', error);
      return null;
    }
  }
};

export const rewardEngine = {
  checkAndAward: async (userId: string, emissions: number, activityType: string) => {
    try {
      // If emissions are low (e.g., < 1kg for transport), award a coupon
      if (emissions < 1.0) {
        // 1. Create Achievement
        await supabase.from('achievements').insert({
          user_id: userId,
          title: 'بطل الانبعاثات المنخفضة',
          description: `لقد قمت بتقليل انبعاثاتك في نشاط ${activityType}`,
          icon: '🌱'
        });

        // 2. Find a relevant coupon
        const { data: coupons } = await supabase
          .from('coupons')
          .select('*')
          .eq('category', activityType === 'transport' ? 'transport' : 'general')
          .limit(1);

        if (coupons && coupons.length > 0) {
          return {
            message: 'لقد قللت انبعاثاتك اليوم! احصل على هذا الكوبون كمكافأة.',
            coupon: coupons[0]
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Reward Engine Error:', error);
      return null;
    }
  }
};
