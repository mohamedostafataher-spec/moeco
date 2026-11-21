
import axios from 'axios';
import { supabase } from './supabaseClient.ts';
import dotenv from 'dotenv';

export const prayerEngine = {
  fetchTimes: async (lat: number, lng: number) => {
    try {
      const response = await axios.get(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=5`);
      if (response.data && response.data.data) {
        const timings = response.data.data.timings;
        
        // Cache in Supabase for others in same area
        const roundedLat = Math.round(lat * 100) / 100;
        const roundedLng = Math.round(lng * 100) / 100;
        
        await supabase.from('prayer_times_cache').upsert({
          lat: roundedLat,
          lng: roundedLng,
          timings: timings,
          date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString()
        }, { onConflict: 'lat,lng,date' });

        return timings;
      }
      throw new Error('Invalid API response');
    } catch (error) {
      console.error('Error fetching prayer times:', error);
      throw error;
    }
  }
};
