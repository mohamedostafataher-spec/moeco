import { supabase } from './supabaseClient';
import { storageService } from './storageService';

export interface AppFeature {
  id: string;
  name: string;
  description: string;
  module: string;
  is_active: boolean;
  engagement_score: number;
  db_table_linked?: string;
}

export const analyticsService = {
  scanLocalSystem: async () => {
    // This simulates a deep reflection/scanning of the system components
    const knownFeatures = [
      { name: 'Eco Market (Souq)', module: 'Rewards', db_table_linked: 'eco_products', description: 'Circular economy marketplace' },
      { name: 'Community Chat', module: 'GreenCommunity', db_table_linked: 'community_messages', description: 'Real-time social interaction' },
      { name: 'Moments Post', module: 'GreenCommunity', db_table_linked: 'community_moments', description: 'Instagram-like eco moments' },
      { name: 'Smart Calculator', module: 'Calculator', db_table_linked: 'consumption_logs', description: 'Carbon footprint tracking' },
      { name: 'Donations Hub', module: 'Rewards', db_table_linked: 'donations', description: 'Give away items for free' },
      { name: 'Digital ID', module: 'Profile', db_table_linked: 'profiles', description: 'National ID and Tier System' },
      { name: 'National Rationalization', module: 'Gov', db_table_linked: 'bills', description: 'Smart Grid Sync' }
    ];

    for (const f of knownFeatures) {
      await analyticsService.registerFeature(f);
    }
  },

  registerFeature: async (featureData: any) => {
    try {
      await supabase.from('app_features').upsert({
        name: featureData.name,
        module: featureData.module,
        db_table_linked: featureData.db_table_linked,
        description: featureData.description,
        is_active: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'name' });
    } catch (e) {
      console.warn("Failed to register feature", e);
    }
  },

  getAllFeatures: async () => {
    try {
      const { data } = await supabase.from('app_features').select('*').order('engagement_score', { ascending: false });
      return data || [];
    } catch (e) {
      return [];
    }
  },

  toggleFeature: async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase.from('app_features').update({ is_active: isActive }).eq('id', id);
      if (error) throw error;
      await storageService.logAdminAction('TOGGLE_FEATURE', 'app_features', id, { isActive });
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
};
