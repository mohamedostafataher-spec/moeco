
/**
 * Data Aggregator Service
 * Merges data from multiple sources with priority and fallback.
 * Priority: Official (Supabase) > API (OSM/GDELT) > Local > Estimated.
 */

import { supabase } from './supabaseClient.ts';
import { osmService } from './osmService.ts';

export const aggregatorService = {
  /**
   * Aggregates transport data from Supabase and OSM.
   */
  aggregateTransportData: async (bbox: [number, number, number, number], type: string): Promise<any[]> => {
    try {
      // 1. Fetch from Official Source (Supabase)
      const { data: officialData, error } = await supabase
        .from('transport_data')
        .select('*')
        .eq('type', type);
      
      if (error) throw error;

      // 2. Fetch from External Source (OSM)
      const osmData = await osmService.getTransportData(bbox, type);

      // 3. Merge and Deduplicate
      // (Simplified: Official data takes priority)
      const mergedData = [...(officialData || [])];
      
      // Add OSM data if not already in official data (based on name or id)
      osmData.forEach(osmItem => {
        const name = osmItem.tags?.name || osmItem.tags?.name_en;
        if (name && !mergedData.some(item => item.name_en === name || item.name_ar === name)) {
          mergedData.push({
            id: `osm-${osmItem.id}`,
            type: type,
            name_en: name,
            name_ar: osmItem.tags?.name_ar || name,
            geometry: {
              type: 'Point',
              coordinates: [osmItem.lon, osmItem.lat]
            },
            source: 'OSM'
          });
        }
      });

      return mergedData;
    } catch (error) {
      console.error('Error aggregating transport data:', error);
      // Fallback: Just OSM if Supabase fails
      return osmService.getTransportData(bbox, type);
    }
  },

  /**
   * Aggregates government services from Supabase and OSM.
   */
  aggregateGovernmentServices: async (bbox: [number, number, number, number], category: string): Promise<any[]> => {
    try {
      // 1. Fetch from Official Source (Supabase)
      const { data: officialData, error } = await supabase
        .from('government_services')
        .select('*')
        .eq('category', category);
      
      if (error) throw error;

      // 2. Fetch from External Source (OSM)
      const osmData = await osmService.getGovernmentServices(bbox, category);

      // 3. Merge and Deduplicate
      const mergedData = [...(officialData || [])];
      
      osmData.forEach(osmItem => {
        const name = osmItem.tags?.name || osmItem.tags?.name_en;
        if (name && !mergedData.some(item => item.name_en === name || item.name_ar === name)) {
          mergedData.push({
            id: `osm-${osmItem.id}`,
            category: category,
            name_en: name,
            name_ar: osmItem.tags?.name_ar || name,
            location_lat: osmItem.lat,
            location_lng: osmItem.lon,
            source: 'OSM'
          });
        }
      });

      return mergedData;
    } catch (error) {
      console.error('Error aggregating gov services:', error);
      return osmService.getGovernmentServices(bbox, category);
    }
  }
};
