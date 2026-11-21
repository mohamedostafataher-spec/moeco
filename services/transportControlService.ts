import { supabase } from './supabaseClient';

export interface Trip {
  id: string;
  name: string;
  from_location: string;
  to_location: string;
  time: string;
  status: string;
  fee: number;
  created_at: string;
}

export interface Complaint {
  id: string;
  user_id: string;
  type: string;
  description: string;
  location: string;
  status: string;
  created_at: string;
}

export interface StationMap {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
  line_id: string;
}

export const transportControlService = {
  getTrips: async () => {
    const { data, error } = await supabase.from('trips').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching trips:', error);
      return [];
    }
    return data as Trip[];
  },

  submitComplaint: async (complaint: Partial<Complaint>) => {
    const { data, error } = await supabase.from('complaints').insert([complaint]).select();
    if (error) {
      throw error;
    }
    return data;
  },

  getComplaints: async () => {
    const { data, error } = await supabase.from('complaints').select('*').order('created_at', { ascending: false });
    if (error) return [];
    return data as Complaint[];
  },

  getStations: async () => {
    const { data, error } = await supabase.from('stations_map').select('*');
    if (error) return [];
    return data as StationMap[];
  },

  subscribeToTrips: (callback: () => void) => {
    return supabase
      .channel('public:trips')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, callback)
      .subscribe();
  },

  subscribeToComplaints: (callback: () => void) => {
    return supabase
      .channel('public:complaints')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, callback)
      .subscribe();
  }
};
