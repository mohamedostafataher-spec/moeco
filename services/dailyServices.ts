
import { supabase } from './supabaseClient';
import axios from 'axios';
import { MultiSourceDataEngine, DataSource } from './MultiSourceDataEngine';
import { calculationEngine } from './calculationEngine';

export interface CommodityPrice {
  product: string;
  price: number;
  unit: string;
  city: string;
  source: string;
  status: 'verified' | 'pending' | 'estimated' | 'live' | 'realtime' | 'cache';
  trust_score: number;
  created_at: string;
  carbon_footprint: number; // kg CO2 per unit
}

export interface PrayerTimes {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

export const dailyServices = {
  // --- Pricing Service ---
  getPrices: async (): Promise<CommodityPrice[]> => {
    const sources: DataSource<CommodityPrice[]>[] = [
      {
        name: 'Official Market Portal (IDSC)',
        fetch: async () => {
          const res = await axios.get('/api/pricing/egypt-market');
          const factors = calculationEngine.emissionFactors || {};
          return res.data.map((p: any) => ({ ...p, status: 'live', carbon_footprint: factors[p.product] || factors['default_food'] || 0.5 }));
        }
      },
      {
        name: 'News Aggregator (Youm7/Masrawy)',
        fetch: async () => {
          const res = await axios.get('/api/news/commodity-prices');
          const factors = calculationEngine.emissionFactors || {};
          return res.data.map((p: any) => ({ ...p, status: 'live', carbon_footprint: factors[p.product] || factors['default_food'] || 0.5 }));
        }
      },
      {
        name: 'Supabase Cloud Sync',
        fetch: async () => {
          const { data, error } = await supabase.from('commodity_prices').select('*').order('created_at', { ascending: false });
          if (error) throw error;
          if (data && data.length > 0) {
            const factors = calculationEngine.emissionFactors || {};
            return data.map(p => ({ ...p, status: 'realtime', carbon_footprint: factors[p.product] || factors['default_food'] || 0.5 }));
          }
          throw new Error('No prices in database');
        }
      }
    ];

    const result = await MultiSourceDataEngine.fetchWithFailover(sources, []);
    
    if (result.status === 'ok' && result.data.length > 0) {
      localStorage.setItem('moeco_prices_cache', JSON.stringify(result.data));
      return result.data;
    }
    
    const cached = localStorage.getItem('moeco_prices_cache');
    return cached ? JSON.parse(cached) : [];
  },

  // --- Prayer Times Service ---
  getPrayerTimes: async (lat: number, lng: number): Promise<PrayerTimes> => {
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      console.error('Invalid coordinates for prayer times:', { lat, lng });
      return null;
    }
    try {
      const response = await axios.get(`/api/prayer-times?lat=${lat}&lng=${lng}`);
      if (response.data) {
        localStorage.setItem('moeco_prayer_cache', JSON.stringify(response.data));
        return response.data;
      }
    } catch (e) {
      const cached = localStorage.getItem('moeco_prayer_cache');
      if (cached) return JSON.parse(cached);
    }
    
    // Fallback: Empty (No dummy data)
    return null;
  },

  // --- Nearby Places Service ---
  getNearby: async (lat: number, lng: number, category?: string, radius: number = 2000) => {
    try {
      const response = await axios.get(`/api/nearby?lat=${lat}&lng=${lng}&category=${category || ''}&radius=${radius}`);
      if (response.data) {
        return response.data;
      }
      return [];
    } catch (e) {
      console.error('Nearby fetch error:', e);
      return [];
    }
  },

  getNearbyOutings: async (lat: number, lng: number) => {
    return dailyServices.getNearby(lat, lng, 'entertainment', 5000);
  },

  // --- Daily Question ---
  getDailyQuestion: async (language: string = 'ar') => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const { data, error } = await supabase
        .from('daily_questions')
        .select('*')
        .eq('date', today)
        .single();
      
      if (data) return data;
    } catch (e) {}
    
    return null;
  },

  // --- Health Facilities ---
  getHealthFacilities: async (lat: number, lng: number) => {
    try {
      const response = await axios.get(`/api/health-facilities?lat=${lat}&lng=${lng}`);
      return response.data;
    } catch (e) {
      return [];
    }
  },

  // --- Parking Finder ---
  getParkingStatus: async (lat: number, lng: number) => {
    try {
      const response = await axios.get(`/api/parking?lat=${lat}&lng=${lng}`);
      return response.data;
    } catch (e) {
      return [];
    }
  },

  // --- Bill Prediction ---
  predictBill: async (usage: number, type: 'electricity' | 'water' | 'gas') => {
    try {
      const res = await calculationEngine.calculate(type, usage);
      return res.totalCost;
    } catch (e) {
      return 0;
    }
  },

  // --- Eco Products ---
  getEcoProducts: async (): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('eco_products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.warn('Failed to fetch eco products', e);
    }
    return [];
  },

  // --- Smart Advice ---
  getSmartAdvice: async (weather: any, traffic: any) => {
    const advices = [];
    if (weather?.temp > 35) advices.push("الجو حار جداً اليوم، يرجى شرب الكثير من الماء وتجنب التعرض المباشر للشمس.");
    if (traffic?.congestion > 0.7) advices.push("هناك ازدحام مروري في بعض المحاور الرئيسية، يفضل استخدام المترو.");
    return advices;
  }
};
