
import axios from 'axios';
import { supabase } from './supabaseClient';
import { storageService } from './storageService';

export interface TrafficReport {
  id: string;
  user_id: string;
  type: 'jam' | 'accident' | 'closed' | 'hazard';
  description: string;
  latitude: number;
  longitude: number;
  created_at: string;
  user_name?: string;
}

/**
 * Traffic Service (Fully Free & Community Based)
 * Replaces TomTom with OpenStreetMap and Crowd-sourced data.
 */
export const trafficService = {
  /**
   * Get traffic data for a specific location
   */
  getTrafficData: async (lat: number, lng: number) => {
    try {
      const reports = await trafficService.getReports();
      // Simple congestion estimation based on number of reports in the area
      const nearbyReports = reports.filter(r => {
        const dist = Math.sqrt(Math.pow(r.latitude - lat, 2) + Math.pow(r.longitude - lng, 2));
        return dist < 0.05; // Roughly 5km
      });

      return {
        congestion: Math.min(0.9, nearbyReports.length * 0.1 + 0.2), // Derived from live community reports
        reports: nearbyReports
      };
    } catch (error) {
      console.error('Error getting traffic data:', error);
      return { congestion: 0.3, reports: [] };
    }
  },

  /**
   * Fetch traffic-related POIs from OpenStreetMap (Free)
   */
  getTrafficPOIs: async (lat: number, lng: number) => {
    return await storageService.robustRequest(`traffic_pois_${lat}_${lng}`, async () => {
      const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];node(around:3000,${lat},${lng})[highway~"traffic_signals|crossing|speed_camera"];out;`;
      const response = await axios.get(overpassUrl);
      return response.data.elements || [];
    }, { timeout: 4000, retries: 1 }) || [];
  },

  /**
   * Crowd-sourced traffic reports from Supabase (Free)
   */
  getReports: async () => {
    const reports = await storageService.robustRequest<TrafficReport[]>('traffic_reports', async () => {
      const { data, error } = await supabase
        .from('traffic_reports')
        .select('*, users(full_name)')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data.map(r => ({
        ...r,
        user_name: r.users?.full_name || r.profiles?.full_name || 'Anonymous'
      })) as TrafficReport[];
    }, { timeout: 5000, retries: 1 });

    return reports || [];
  },

  /**
   * Submit a new traffic report
   */
  submitReport: async (report: Omit<TrafficReport, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('traffic_reports')
        .insert([report]);
      
      // Also submit to the required complaints table
      await supabase.from('complaints').insert([{
        user_id: report.user_id,
        type: report.type,
        description: report.description,
        location: `${report.latitude},${report.longitude}`,
        status: 'pending'
      }]);
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error submitting traffic report:', error);
      throw error;
    }
  },

  /**
   * Subscribe to real-time traffic reports
   */
  subscribeToReports: (onUpdate: (payload: any) => void) => {
    return supabase
      .channel('traffic_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'traffic_reports' }, onUpdate)
      .subscribe();
  }
};
