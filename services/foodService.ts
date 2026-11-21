
import { supabase } from './supabaseClient';

export interface FoodItem {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  category: 'recipe' | 'restaurant' | 'tip';
  image: string;
  carbon_score: number;
  rating?: number;
  prep_time?: string;
  calories?: number;
  location?: string;
  tags: string[];
}

export interface SeasonalFood {
  name_ar: string;
  name_en: string;
  month: string;
}

export interface WasteTip {
  title_ar: string;
  title_en: string;
  desc_ar: string;
  desc_en: string;
}

export const foodService = {
  fetchFoodItems: async (): Promise<FoodItem[]> => {
    try {
      const { data, error } = await supabase
        .from('food_items')
        .select('*')
        .order('carbon_score', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error in foodService.fetchFoodItems:', error);
      return [];
    }
  },

  fetchSeasonalFoods: async (): Promise<SeasonalFood[]> => {
    try {
      const { data, error } = await supabase
        .from('seasonal_foods')
        .select('*');
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching seasonal foods:', error);
      return [];
    }
  },

  fetchWasteTips: async (): Promise<WasteTip[]> => {
    try {
      const { data, error } = await supabase
        .from('waste_tips')
        .select('*');
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching waste tips:', error);
      return [];
    }
  }
};
