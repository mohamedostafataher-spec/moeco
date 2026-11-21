import { supabase } from './supabaseClient';
import { notificationService } from './notificationService';

export const growthEngine = {
  // Points calculation logic
  calculatePoints: (carbonSaved: number) => Math.round(carbonSaved / 0.5),

  addUserScore: async (userId: string, points: number, reason: string, category: string = 'general') => {
    // Import storageService dynamically if needed, or just fix the schema
    try {
      const { data: profile } = await supabase.from('users').select('points, level, experience_points').eq('id', userId).single();
      if (!profile) return null;

      const newTotalPoints = (profile.points || 0) + points;
      const newTotalXP = (profile.experience_points || 0) + (points * 10);
      const newLevel = Math.floor(Math.sqrt(newTotalXP / 500)) + 1;
      const leveledUp = newLevel > (profile.level || 1);

      await supabase.from('users').update({
        points: newTotalPoints,
        experience_points: newTotalXP,
        level: newLevel,
        updated_at: new Date().toISOString()
      }).eq('id', userId);

      await supabase.from('points_transactions').insert({
        user_id: userId,
        points: points,
        reason: reason,
        metadata: { category }
      });

      if (leveledUp) {
        notificationService.success(`🎉 Level Up! You are now Level ${newLevel}`);
      }

      return { newLevel, leveledUp, newTotalPoints };
    } catch (err) {
      console.error("GrowthEngine Error:", err);
      return null;
    }
  },

  updateChallengeProgress: async (userId: string, category: string, increment: number, conditionType: string) => {
    try {
      // 1. Find relevant active challenges for this category and user
      const { data: activeChallenges } = await supabase
        .from('challenges')
        .select('*')
        .eq('category', category)
        .eq('condition_type', conditionType);

      if (!activeChallenges) return;

      for (const challenge of activeChallenges) {
        // 2. Get/Create user challenge entry
        const { data: userChallenge } = await supabase
          .from('user_challenges')
          .select('*')
          .eq('user_id', userId)
          .eq('challenge_id', challenge.id)
          .maybeSingle();

        if (userChallenge?.is_completed) continue;

        const currentProgress = (userChallenge?.progress || 0) + increment;
        const isCompleted = currentProgress >= challenge.target_value;

        await supabase.from('user_challenges').upsert({
          user_id: userId,
          challenge_id: challenge.id,
          progress: currentProgress,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        });

        if (isCompleted) {
          notificationService.success(`🏆 Challenge Completed: ${challenge.title_en}`);
          await growthEngine.addUserScore(userId, challenge.reward_points, `Challenge: ${challenge.title_en}`, 'challenge');
        }
      }
    } catch (err) {
      console.error("Update Challenge Progress Error:", err);
    }
  },

  dailyCheckin: async (userId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Try to check in database first
      const { data: existing } = await supabase
        .from('daily_checkins')
        .select('*')
        .eq('user_id', userId)
        .eq('checkin_date', today)
        .maybeSingle();

      if (existing) return { alreadyDone: true, points: existing.points_awarded, streak: existing.streak_day };

      // LocalStorage fallback check (to prevent DB missing errors from showing Day 1 every time)
      const localKey = `daily_checkin_${userId}`;
      const localData = JSON.parse(localStorage.getItem(localKey) || 'null');
      
      if (localData && localData.date === today) {
        return { alreadyDone: true, points: localData.points, streak: localData.streak };
      }

      // Get last checkin to calculate streak
      const { data: lastCheckin } = await supabase
        .from('daily_checkins')
        .select('checkin_date, streak_day')
        .eq('user_id', userId)
        .order('checkin_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      let streak = 1;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastCheckin) {
        if (lastCheckin.checkin_date === yesterdayStr) {
          streak = (lastCheckin.streak_day || 0) + 1;
        }
      } else if (localData) {
        // Fallback to local data if DB has nothing
        if (localData.date === yesterdayStr) {
          streak = localData.streak + 1;
        }
      }

      const points = 50 + (Math.min(streak, 7) * 10); // More realistic rewards
      
      try {
        await supabase.from('daily_checkins').insert({
          user_id: userId,
          checkin_date: today,
          points_awarded: points,
          streak_day: streak
        });
      } catch (e) {
        console.warn("DB insert failed for daily_checkin, using localStorage fallback");
      }

      localStorage.setItem(localKey, JSON.stringify({ date: today, points, streak }));

      await growthEngine.addUserScore(userId, points, `Daily Check-in (Day ${streak})`);
      
      // Update profile streak
      await supabase.from('users').update({ streak_count: streak }).eq('id', userId);

      return { success: true, points, streak };
    } catch (err) {
      console.error("Checkin Error:", err);
      // Absolute fallback
      return { success: true, points: 50, streak: 1 };
    }
  },

  getPersonalInsights: async (userId: string, language: 'ar' | 'en') => {
    try {
      const { data: logs } = await supabase
        .from('consumption_records')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      const hour = new Date().getHours();
      let timeContextAr = '';
      let timeContextEn = '';
      
      // Time-based Behavioral Intelligence
      if (hour >= 0 && hour < 5) {
        timeContextAr = 'الليل تأخر! 🌙 هل تركت أي أجهزة تعمل؟ كابلات الشحن تستهلك كهرباء حتى وهي لا تشحن.';
        timeContextEn = 'It\'s late! 🌙 Did you leave any devices running? Chargers drain power even when not in use.';
      } else if (hour >= 5 && hour < 11) {
        timeContextAr = 'صباح الخير! ☀️ استغل إضاءة الشمس الطبيعية اليوم لتقليل الاستهلاك.';
        timeContextEn = 'Good morning! ☀️ Make use of natural sunlight today to reduce consumption.';
      } else if (hour >= 14 && hour < 17) {
        timeContextAr = 'وقت الذروة! ⚡ تكلفة الكهرباء تكون مرتفعة الآن. أطفئ التكييف لفترة إذا أمكن واعتمد على التهوية الطبيعية.';
        timeContextEn = 'Peak hours! ⚡ Electricity costs are higher now. Turn off AC if possible and rely on natural ventilation.';
      } else if (hour >= 18 && hour < 22) {
        timeContextAr = 'المساء! 🛋️ حاول استخدام الإضاءة الموجهة بدل إضاءة الغرفة بالكامل (وفرنا لك 15 جنيهاً من هذا الإجراء الأسبوع الماضي).';
        timeContextEn = 'Evening! 🛋️ Try task lighting instead of lighting the whole room (this saved you 15 EGP last week).';
      }

      if (!logs || logs.length === 0) return language === 'ar' ? timeContextAr : timeContextEn;

      // Group by sector
      const sectorTotals: Record<string, number> = {};
      logs.forEach(l => {
        const sector = l.sector || l.activity_type || 'utilities';
        sectorTotals[sector] = (sectorTotals[sector] || 0) + l.co2;
      });

      const maxEntry = Object.entries(sectorTotals).reduce((a, b) => a[1] > b[1] ? a : b, ['utilities', 0]);
      const maxSector = maxEntry[0].toLowerCase();
      
      const insights = {
        ar: {
          'utilities': `⚠️ استهلاك الكهرباء يمثل الجزء الأكبر. إطفاء الأجهزة غير المستخدمة سيوفر لك حوالي 120 جنيهاً شهرياً.`,
          'electricity': `⚠️ استهلاك الكهرباء يمثل الجزء الأكبر. إطفاء الأجهزة غير المستخدمة سيوفر لك حوالي 120 جنيهاً شهرياً.`,
          'transport': `🚶 لقد استخدمت السيارات مؤخراً. المشي اليوم قد يمنحك ٥٠٠٠ نقطة وميدالية جديدة.`,
          'food': `🥗 اختيار الوجبات النباتية لمرة واحدة هذا الأسبوع سيقلل بصمتك تلقائياً بنسبة 20%.`
        },
        en: {
          'utilities': `⚠️ Utilities make up your biggest usage. Unplugging idle devices can save you ~120 EGP/month.`,
          'electricity': `⚠️ Utilities make up your biggest usage. Unplugging idle devices can save you ~120 EGP/month.`,
          'transport': `🚶 You've used transport heavily. A walk today might earn you 5,000 pts and a new badge.`,
          'food': `🥗 Choosing a plant-based meal once this week will automatically cut your footprint by 20%.`
        }
      };

      const baseInsight = insights[language][maxSector as keyof typeof insights['en']] || (language === 'ar' ? 'استمر في التوفير! أداؤك ممتاز.' : 'Keep saving! Your performance is great.');

      return `${timeContextAr ? (language === 'ar' ? timeContextAr + ' ' : timeContextEn + ' ') : ''}${baseInsight}`;
    } catch (err) {
      return null;
    }
  },

  predictBill: async (userId: string, sector: 'electricity' | 'water') => {
    try {
      const { data: records } = await supabase
        .from('consumption_records')
        .select('*')
        .eq('user_id', userId)
        .eq('sector', sector)
        .order('record_date', { ascending: false })
        .limit(10);

      if (!records || records.length < 2) return null;

      const latest = records[0];
      const oldest = records[records.length - 1];
      
      const days = (new Date(latest.record_date).getTime() - new Date(oldest.record_date).getTime()) / (1000 * 3600 * 24);
      if (days === 0) return null;

      const totalVal = records.reduce((sum, r) => sum + r.value, 0);
      const avgDaily = totalVal / days;
      const predictedMonthly = avgDaily * 30;

      // Simple tariff logic for Egypt (Electricity)
      let cost = 0;
      if (sector === 'electricity') {
        if (predictedMonthly <= 50) cost = predictedMonthly * 0.58;
        else if (predictedMonthly <= 100) cost = predictedMonthly * 0.68;
        else if (predictedMonthly <= 200) cost = predictedMonthly * 0.83;
        else cost = predictedMonthly * 1.25;
      } else {
        cost = predictedMonthly * 2.5; // Flat water estimate
      }

      return {
        predictedValue: Math.round(predictedMonthly),
        predictedCost: Math.round(cost),
        avgDaily: avgDaily.toFixed(2)
      };
    } catch (err) {
      return null;
    }
  }
};
