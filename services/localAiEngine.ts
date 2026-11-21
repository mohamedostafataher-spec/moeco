import { storageService } from './storageService';
import { supabase } from './supabaseClient';

export interface AIInsight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'critical';
  title: string;
  message: string;
  actionParams?: any;
}

export const localAIEngine = {
  analyzeUserConsumption: async (userId: string, language: string = 'ar'): Promise<AIInsight[]> => {
    const rawRecords = await storageService.getRecords();
    const records = rawRecords.filter(r => r.userId === userId);
    const insights: AIInsight[] = [];
    
    // Group by sector
    const bySector: Record<string, number> = {};
    let totalCarbon = 0;
    
    records.forEach(r => {
      const co2 = r.co2_impact || r.co2 || 0;
      bySector[r.sector || 'general'] = (bySector[r.sector || 'general'] || 0) + co2;
      totalCarbon += co2;
    });

    if (records.length === 0) {
      insights.push({
        id: 'no-data',
        type: 'info',
        title: language === 'ar' ? 'مرحباً في نظام MoEco!' : 'Welcome to MoEco!',
        message: language === 'ar' ? 'قم بإضافة استهلاكك الأول في حاسبة الكربون لكي أتمكن من تحليل بصمتك.' : 'Add your first consumption to get AI analysis.'
      });
      return insights;
    }

    // 1. Identify biggest contributor
    let topSector = '';
    let max = 0;
    Object.keys(bySector).forEach(s => {
      if (bySector[s] > max) {
        max = bySector[s];
        topSector = s;
      }
    });

    if (topSector) {
      const percentage = Math.round((max / totalCarbon) * 100);
      const sectorAr = topSector === 'electricity' ? 'الكهرباء' : topSector === 'water' ? 'المياه' : topSector === 'transport' ? 'النقل' : topSector;
      const sectorEn = topSector;
      
      insights.push({
        id: 'top-contributor',
        type: percentage > 50 ? 'warning' : 'info',
        title: language === 'ar' ? `تحليل البصمة الرئيسي` : `Primary Footprint Analysis`,
        message: language === 'ar' 
          ? `يشكل قطاع ${sectorAr} أعلى نسبة استهلاك لديك بمقدار ${percentage}% من إجمالي انبعاثاتك. يوصى بتقليل الاستهلاك في هذا القطاع.` 
          : `The ${sectorEn} sector accounts for ${percentage}% of your total emissions. Consider reducing usage here.`
      });
    }

    // 2. Trend analysis (Last 7 days vs Previous 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const recent = records.filter(r => new Date(r.date || '') >= sevenDaysAgo).reduce((acc, curr) => acc + (curr.co2_impact || curr.co2 || 0), 0);
    const previous = records.filter(r => {
      const d = new Date(r.date || '');
      return d >= fourteenDaysAgo && d < sevenDaysAgo;
    }).reduce((acc, curr) => acc + (curr.co2_impact || curr.co2 || 0), 0);

    if (previous > 0) {
      const diff = ((recent - previous) / previous) * 100;
      if (diff > 10) {
        insights.push({
          id: 'increasing-trend',
          type: 'critical',
          title: language === 'ar' ? 'تنبيه: زيادة في الاستهلاك' : 'Alert: Usage Increase',
          message: language === 'ar' 
            ? `استهلاكك هذا الأسبوع ارتفع بنسبة ${Math.round(diff)}% مقارنة بالأسبوع الماضي. هل قمت بتشغيل أجهزة إضافية مؤخراً؟`
            : `Your usage this week increased by ${Math.round(diff)}% compared to last week.`
        });
      } else if (diff < -10) {
        insights.push({
          id: 'decreasing-trend',
          type: 'success',
          title: language === 'ar' ? 'أداء ممتاز!' : 'Great Performance!',
          message: language === 'ar'
            ? `لقد نجحت في تقليل انبعاثاتك بنسبة ${Math.abs(Math.round(diff))}% مقارنة بالأسبوع الماضي. استمر في هذا الأداء!`
            : `You reduced your emissions by ${Math.abs(Math.round(diff))}% compared to last week.`
        });
      }
    }

    return insights;
  }
};
