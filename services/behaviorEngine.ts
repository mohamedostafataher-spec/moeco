
import { storageService } from './storageService';

export const behaviorEngine = {
  getPersonalityMood: (usageRecords: any[], lang: string = 'ar') => {
    const isRtl = lang === 'ar';
    const hour = new Date().getHours();
    
    // Time-based greetings
    let greeting = "";
    if (hour < 12) greeting = isRtl ? "صباح الخير يا بطل التوفير! ☀️" : "Good morning, Eco-Hero! ☀️";
    else if (hour < 18) greeting = isRtl ? "طاب مساؤك، كيف حال استهلاكك اليوم؟ 🌤️" : "Good afternoon, how is your usage today? 🌤️";
    else greeting = isRtl ? "مساء النور، هل تذكرت فصل الأجهزة غير المستخدمة؟ 🌙" : "Good evening, did you remember to unplug? 🌙";

    if (!usageRecords || usageRecords.length === 0) {
      return {
        greeting,
        message: isRtl ? "أنا متحمس لمساعدتك في رحلة التوفير! ابدأ بتسجيل أول فاتورة." : "I'm excited to help you save! Start by logging your first bill.",
        mood: 'happy'
      };
    }

    const electricity = usageRecords.filter(r => r.sector === 'electricity');
    const avg = electricity.length > 0 ? (electricity.reduce((s, r) => s + r.value, 0) / electricity.length) : 0;

    if (avg > 400) {
      return {
        greeting,
        message: isRtl ? "لاحظت زيادة في استهلاكك مؤخراً. لا تقلق، يمكننا العودة للشريحة الأولى معاً! 💪" : "I noticed a spike in your usage recently. Don't worry, we can get back to Tier 1 together! 💪",
        mood: 'encouraging'
      };
    }

    return {
      greeting,
      message: isRtl ? "أداؤك مذهل! أنت فعلاً توفر الكثير من المال لعائلتك. 💰" : "Your performance is amazing! You are saving a lot of money for your family. 💰",
      mood: 'proud'
    };
  },

  generatePredictiveTips: (usageRecords: any[], lang: string = 'ar') => {
    const isRtl = lang === 'ar';
    const tips = [];
    
    // Ghost Usage Logic (Usage during late night)
    const nightUsage = usageRecords.filter(r => {
      const h = new Date(r.created_at).getHours();
      return h >= 0 && h <= 5;
    });

    if (nightUsage.length > 5) {
      tips.push({
        id: 'ghost',
        title: isRtl ? "تنبيه الاستهلاك الشبح" : "Ghost Usage Alert",
        desc: isRtl ? "سجلت استهلاكاً عالياً في وقت المتأخر. تأكد من إطفاء الراوتر والشاشات قبل النوم." : "High usage recorded late at night. Unplug your router and screens before bed.",
        icon: 'Ghost'
      });
    }

    // Money Saving Tip
    tips.push({
      id: 'money',
      title: isRtl ? "خطة التوفير القادم" : "Upcoming Savings Plan",
      desc: isRtl ? "بتقليل الاستهلاك بنسبة 10% فقط، ستوفر حوالي 150 جنيه شهرياً." : "By reducing usage by just 10%, you'll save around 150 EGP monthly.",
      icon: 'DollarSign'
    });

    return tips;
  },

  getSmartAdvice: async (userId: string, lang: string = 'ar') => {
    const history = await storageService.fetchUserHistory(userId, 50);
    return behaviorEngine.generatePredictiveTips(history, lang);
  }
};
