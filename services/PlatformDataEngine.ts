import { supabase } from './supabaseClient';
import { storageService } from './storageService';
import { FuelIntelligenceEngine } from './FuelIntelligenceEngine';

export interface PlatformConfig {
  source: string;
  category: string;
  location: string;
}

export const PlatformDataEngine = {
  async fetchWithFailover<T>(
    tableName: string, 
    apiFetcher: () => Promise<T[]>, 
    supabaseQuery: any
  ): Promise<T[]> {
    try {
      // 1. Try Supabase first
      const { data, error } = await supabaseQuery;
      
      if (!error && data && data.length > 0) {
        return data as T[];
      }
      
      console.warn(`Supabase ${tableName} empty or failed, trying fallback API...`);
    } catch (e) {
      console.warn(`Supabase ${tableName} error:`, e);
    }

    // 2. Fallback to API
    try {
      const apiData = await apiFetcher();
      
      if (apiData && apiData.length > 0) {
        // 3. Save to Supabase for next time (Fire and forget to not block)
        this.syncToSupabase(tableName, apiData).catch(err => {
           console.error(`Failed to sync API data to Supabase table ${tableName}:`, err);
        });
      }
      
      return apiData;
    } catch (apiError) {
      console.error(`Fallback API failed for ${tableName}:`, apiError);
      return [];
    }
  },

  async syncToSupabase(tableName: string, data: any[]) {
    if (data.length === 0) return;
    
    // Attempt normal insert. If table doesn't exist, it will just fail.
    const { error } = await supabase.from(tableName).insert(
      data.map(item => ({ ...item, updated_at: new Date().toISOString() }))
    );
    
    if (error) {
       throw error;
    }
  },

  // ------------- DOMAIN: ECONOMY (products_prices) -------------
  async getEconomyPrices(location: string = 'Egypt') {
    return this.fetchWithFailover(
      'products_prices',
      async () => {
        const fuelPrices = await FuelIntelligenceEngine.getLatestPrices();
        const fuelItems = fuelPrices.map(fp => ({
          name: fp.fuel_type.toUpperCase(),
          name_en: fp.fuel_type.toUpperCase(),
          category: 'Fuel',
          price: fp.price,
          unit: 'L',
          location,
          source: fp.source,
          updated_at: fp.updated_at
        }));

        return fuelItems;
      },
      supabase.from('products_prices').select('*').limit(50).order('updated_at', { ascending: false })
    );
  },

  // ------------- DOMAIN: LIFESTYLE (places) -------------
  async getPlaces(location: string, category: string = 'all') {
    return this.fetchWithFailover(
      'places',
      async () => {
        return []; // No static fallbacks
      },
      category === 'all' 
        ? supabase.from('places').select('*').limit(20)
        : supabase.from('places').select('*').eq('category', category).limit(20)
    );
  },

  // ------------- DOMAIN: SERVICES (gov_services) -------------
  async getGovServices(location: string) {
    return this.fetchWithFailover(
      'gov_services',
      async () => {
        return []; // No static fallbacks
      },
      supabase.from('gov_services').select('*').limit(50)
    );
  },

  // ------------- DOMAIN: ENVIRONMENT (environmental_data) -------------
  async getEnvironmentalData(location: string) {
    return this.fetchWithFailover(
      'environmental_data',
      async () => {
        return []; // No static fallbacks
      },
      supabase.from('environmental_data').select('*').limit(20)
    );
  }
};
