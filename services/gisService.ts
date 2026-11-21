
import { supabase } from './supabaseClient';
import { GISFeature, UserPath, SpatialAnalysis, GeofenceZone } from '../types';

export const gisService = {
  // 1. GIS Features
  getFeatures: async (category?: string): Promise<GISFeature[]> => {
    try {
      let query = supabase.from('gis_features').select('*');
      if (category && category !== 'all') {
        query = query.eq('category', category);
      }
      const { data, error } = await query;
      
      // Fallback local data for Egypt Live Map (Phase 3)
      if (!data || data.length === 0) {
        const fallbacks: GISFeature[] = [
          { id: 'f1', name_ar: 'المرور - تقاطع رمسيس', name_en: 'Traffic - Ramsis Eq', category: 'EmissionZone', sub_category: 'High Traffic', geometry: { type: 'Point', coordinates: [31.25, 30.06] }, properties: { intensity: 0.9, details_ar: 'زحام شديد جدا' } },
          { id: 'f2', name_ar: 'محطة مترو الشهداء', name_en: 'Shohada Metro', category: 'Transport', sub_category: 'Metro', geometry: { type: 'Point', coordinates: [31.2464, 30.0617] }, properties: {} },
          { id: 'f3', name_ar: 'سجل مدني العباسية', name_en: 'Abbasia Civil Registry', category: 'GovService', sub_category: 'Civil', geometry: { type: 'Point', coordinates: [31.28, 30.07] }, properties: { details_ar: 'تصاريح وشهادات ميلاد أونلاين عبر MoEco', details_en: 'Docs/Birth Certificates via MoEco' } },
          { id: 'f4', name_ar: 'محطة طاقة شمسية', name_en: 'Solar Plant Point', category: 'EcoPoint', sub_category: 'Energy', geometry: { type: 'Point', coordinates: [31.18, 30.01] }, properties: {} },
          { id: 'f5', name_ar: 'حديقة الأزهر', name_en: 'Al-Azhar Park', category: 'EcoPoint', sub_category: 'Park', geometry: { type: 'Point', coordinates: [31.2644, 30.0416] }, properties: { aqi: 42, details_ar: 'جودة هواء ممتازة' } },
          { id: 'f6', name_ar: 'زحام كوبري أكتوبر', name_en: '6th October Bridge Traffic', category: 'EmissionZone', sub_category: 'High Traffic', geometry: { type: 'Point', coordinates: [31.235, 30.045] }, properties: { intensity: 0.8, details_ar: 'زحام خانق، يفضل اتخاذ مسار بديل' } },
        ];
        
        if (category && category !== 'all') {
          return fallbacks.filter(f => f.category === category);
        }
        return fallbacks;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching GIS features:', error);
      return [];
    }
  },

  subscribeToFeatures: (callback: (payload: any) => void) => {
    return supabase
      .channel('gis_features_changes')
      .on('postgres_changes', { event: '*', table: 'gis_features', schema: 'public' }, callback)
      .subscribe();
  },

  // 2. User Paths
  saveUserPath: async (path: Omit<UserPath, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase.from('user_paths').insert(path).select().single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving user path:', error);
      throw error;
    }
  },

  getUserPaths: async (userId: string): Promise<UserPath[]> => {
    try {
      const { data, error } = await supabase
        .from('user_paths')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user paths:', error);
      return [];
    }
  },

  // 3. Spatial Analysis
  getSpatialAnalysis: async (type?: string): Promise<SpatialAnalysis[]> => {
    try {
      let query = supabase.from('spatial_analysis').select('*');
      if (type) {
        query = query.eq('analysis_type', type);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching spatial analysis:', error);
      return [];
    }
  },

  // 4. Geofencing
  getGeofenceZones: async (): Promise<GeofenceZone[]> => {
    try {
      const { data, error } = await supabase.from('geofence_zones').select('*');
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching geofence zones:', error);
      return [];
    }
  },

  // 5. Overpass API Fallback
  // If Supabase is empty, we can fetch from Overpass and cache it
  // 6. Spatial Analysis Logic
  performSpatialAnalysis: async (regionName: string, type: 'PopulationDensity' | 'ServiceDensity' | 'EmissionDensity') => {
    try {
      const features = await gisService.getFeatures();
      let value = 0;

      if (type === 'ServiceDensity') {
        // Count services in the region (simplified)
        value = features.filter(f => f.category === 'GovService' || f.category === 'EcoPoint').length / 10;
      } else if (type === 'EmissionDensity') {
        // Average intensity of emission zones
        const zones = features.filter(f => f.category === 'EmissionZone');
        value = zones.reduce((acc, z) => acc + (z.properties?.intensity || 0), 0) / (zones.length || 1);
      }

      const analysis: Omit<SpatialAnalysis, 'id' | 'created_at'> = {
        region_name: regionName,
        analysis_type: type,
        value: value,
        geometry: {
          type: 'Polygon',
          coordinates: [[[31.2, 30.0], [31.3, 30.0], [31.3, 30.1], [31.2, 30.1], [31.2, 30.0]]] // Sample Cairo box
        }
      };

      const { data, error } = await supabase.from('spatial_analysis').insert(analysis).select().single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error performing spatial analysis:', error);
      throw error;
    }
  }
};
