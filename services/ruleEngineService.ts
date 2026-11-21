
import { supabase } from './supabaseClient';

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: 'carbon' | 'water' | 'energy' | 'transport';
  actionUrl: string; // Internal deep link
  icon: string;
}

export const ruleEngineService = {
  analyzeConsumption: (consumptionData: any, isAr: boolean = false): Recommendation[] => {
    const recommendations: Recommendation[] = [];

    // Rule: High Carbon Transport
    if (consumptionData.transport_impact > 50) {
      recommendations.push({
        id: 'rec_transport_001',
        title: isAr ? 'ارتفاع البصمة الكربونية للتنقل' : 'High Carbon Impact detected!',
        description: isAr 
          ? 'استهلاكك للوقود في التنقل مرتفع. جرب بدائل النقل العام الذكي لتقليل بصمتك.' 
          : 'You are using a lot of fuel-based transport. Try our green commute alternatives.',
        category: 'transport',
        actionUrl: '/TransportHub',
        icon: 'Truck'
      });
    }

    // Rule: High Water Consumption
    if (consumptionData.water_consumption > 150) {
      recommendations.push({
        id: 'rec_water_001',
        title: isAr ? 'استهلاك مياه مرتفع' : 'High Water Usage',
        description: isAr
          ? 'استهلاكك للمياه يتجاوز المتوسط. تعرف على طرق توفير المياه في منزلك.'
          : 'Your water usage is above average. Discover tips to reduce waste.',
        category: 'water',
        actionUrl: '/EcoHomeAudit',
        icon: 'Droplets'
      });
    }

    // Rule: Energy Efficiency Insight (Peak Hours)
    if (consumptionData.peak_energy_use > 300) {
      recommendations.push({
        id: 'rec_energy_001',
        title: isAr ? 'ترشيد استهلاك الكهرباء' : 'Energy Efficiency Insight',
        description: isAr
          ? 'استهلاكك في ساعات الذروة مرتفع. جرب جدولة استخدام الأجهزة لتقليل الضغط على الشبكة.'
          : 'Your energy use during peak hours is high. Try scheduling heavy appliance use for off-peak times.',
        category: 'energy',
        actionUrl: '/SmartCalculator',
        icon: 'Zap'
      });
    }

    // Rule: Low Recycling Engagement
    if (!consumptionData.recycling_history || consumptionData.recycling_history.length < 1) {
      recommendations.push({
        id: 'rec_carbon_001',
        title: isAr ? 'ابدأ رحلة إعادة التدوير' : 'Start Recycling',
        description: isAr
          ? 'إعادة التدوير تقلل من انبعاثات الكربون بنسبة 30%. ابدأ أول بلاغ تجميع اليوم.'
          : 'Recycling can reduce your carbon footprint by 30%. Start your first collection report today.',
        category: 'carbon',
        actionUrl: '/GarbageCollection',
        icon: 'Trash2'
      });
    }

    return recommendations;
  },

  submitFeedback: async (userId: string, recommendationId: string, rating: number) => {
    return await supabase
      .from('ai_recommendation_feedback')
      .insert([{ user_id: userId, recommendation_id: recommendationId, rating }]);
  }
};
