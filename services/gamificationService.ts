import { storageService } from './storageService';
import { supabase } from './supabaseClient';
import { User } from '../types'; // Adjust based on your types
import { notificationService } from './notificationService';

export interface GamificationAction {
  id: string;
  type: 'online_service' | 'map_usage' | 'community_post' | 'green_transport' | 'recycle' | 'energy_saved';
  points: number;
  carbonSavedGrams: number;
  description_ar: string;
  description_en: string;
}

const ACTION_DICTIONARY: Record<string, GamificationAction> = {
  'use_digital_id': { id: 'use_digital_id', type: 'online_service', points: 15, carbonSavedGrams: 50, description_ar: 'استخدام الهوية الرقمية (بدون مشوار)', description_en: 'Used Digital ID (saved a trip)' },
  'renew_license_online': { id: 'renew_license_online', type: 'online_service', points: 50, carbonSavedGrams: 1200, description_ar: 'تجديد رخصة أونلاين', description_en: 'Online License Renewal' },
  'post_green_tip': { id: 'post_green_tip', type: 'community_post', points: 10, carbonSavedGrams: 0, description_ar: 'مشاركة نصيحة خضراء', description_en: 'Shared a green tip' },
  'eco_transport': { id: 'eco_transport', type: 'green_transport', points: 25, carbonSavedGrams: 750, description_ar: 'استخدام نقل صديق للبيئة', description_en: 'Used eco-transport' },
};

class GamificationService {
  public async recordAction(userId: string | undefined, actionKey: keyof typeof ACTION_DICTIONARY) {
    if (!userId) return;
    const action = ACTION_DICTIONARY[actionKey];
    if (!action) return;

    try {
      // 1. Update Profile (Points & Carbon)
      const currentProfile = await storageService.getUserProfile(userId);
      const newPoints = (currentProfile?.points || 0) + action.points;
      
      // Update in local/Supabase
      await supabase.from('users').update({ points: newPoints }).eq('id', userId);
      
      // 2. Track Carbon in logs (if carbon was saved)
      if (action.carbonSavedGrams > 0) {
        try {
          const { error } = await supabase.from('carbon_footprint_logs').insert({
            user_id: userId,
            activity_type: action.type,
            sector: 'gov_services',
            carbon_amount: -(action.carbonSavedGrams) / 1000, // Negative because saved
            metadata: { action: actionKey, description: action.description_en }
          });
          if (error && error.message.includes('schema cache')) throw error;
        } catch (e) {
          console.warn("Saving carbon log locally (Table Missing)");
          const logs = JSON.parse(localStorage.getItem('moeco_local_carbon_logs') || '[]');
          logs.push({
            timestamp: new Date().toISOString(),
            amount: -(action.carbonSavedGrams) / 1000,
            type: action.type
          });
          localStorage.setItem('moeco_local_carbon_logs', JSON.stringify(logs));
        }
      }

      // 3. Notify user
      notificationService.success(`+${action.points} PTS: ${action.description_en} | Carbon Saved: ${action.carbonSavedGrams}g`);

      // 4. Check for level up
      this.checkLevelUp(userId, newPoints, currentProfile?.level || 1);

    } catch (e) {
      console.error('Error recording action', e);
    }
  }

  private async checkLevelUp(userId: string, currentPoints: number, currentLevel: number) {
    const nextLevelThreshold = currentLevel * 100; // e.g., Lvl 2 needs 100, Lvl 3 needs 200...
    if (currentPoints >= nextLevelThreshold) {
      const newLevel = currentLevel + 1;
      await supabase.from('users').update({ level: newLevel }).eq('id', userId);
      notificationService.success(`🎉 Level UP! You reached Level ${newLevel}!`);
    }
  }
}

export const gamificationService = new GamificationService();
