import { supabase } from './supabaseClient';
import { storageService } from './storageService';

export const aiService = {
  getEcoTips: async (userId: string, language: string = 'ar') => {
    try {
      // 1. Fetch recent activity to generate contextual tips
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: recentConsumption } = await supabase
        .from('consumption_records')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', twentyFourHoursAgo);

      // 2. Base rule engine
      const tips = [];
      const isRtl = language === 'ar';

      // Rule: Electricity Spike
      const electricityLogs = recentConsumption?.filter((r: any) => r.sector === 'Electricity') || [];
      const electricityTotal = electricityLogs.reduce((sum: number, r: any) => sum + (r.value || 0), 0);
      
      if (electricityTotal > 50) {
         tips.push(isRtl 
           ? '💡 استهلاكك للكهرباء مرتفع اليوم. حاول إطفاء الأجهزة غير المستخدمة لتقليل الانبعاثات.' 
           : '💡 Your electricity usage is high today. Try turning off idle devices to save energy.');
      }

      // Rule: Transport emissions
      const transportLogs = recentConsumption?.filter((r: any) => r.sector === 'Transport') || [];
      if (transportLogs.length > 0) {
         const transportTotal = transportLogs.reduce((sum: number, r: any) => sum + (r.co2 || 0), 0);
         if (transportTotal > 15) {
             tips.push(isRtl 
               ? '🚗 انبعاثات النقل الخاصة بك تتزايد. فكر في استخدام وسائل النقل العام أوالدراجة غدًا!' 
               : '🚗 Your transport emissions are growing. Consider public transit or biking tomorrow!');
         }
      }

      // Rule: No recent activity (fallback / encouraging tip)
      if (!recentConsumption || recentConsumption.length === 0) {
         tips.push(isRtl 
           ? '🌱 لم تقم بتسجيل أي أنشطة مؤخراً. قم بتسجيل استهلاكك اليومي لمعرفة بصمتك الكربونية وكسب النقاط!' 
           : '🌱 You haven\'t logged activities recently. Log your daily usage to track your footprint and earn points!');
      }

      // Add positive reinforcement
      if (electricityTotal < 10 && electricityLogs.length > 0) {
         tips.push(isRtl 
           ? '🌟 أداء ممتاز! استهلاكك للكهرباء منخفض جداً اليوم، أنت تسهم في حماية البيئة.' 
           : '🌟 Great job! Your electricity usage is very low today, you are helping the planet.');
      }

      // Return a random relevant tip, or the first one
      return tips[Math.floor(Math.random() * tips.length)] || (isRtl ? 'استمر في حماية كوكبنا!' : 'Keep protecting our planet!');

    } catch (e) {
      console.error("AI Error:", e);
      return language === 'ar' ? 'يمكنك دائماً تحسين بصمتك الكربونية باتباع عادات مستدامة.' : 'You can always improve your footprint with sustainable habits.';
    }
  },

  getGeoInsights: async (governorate: string, language: string = 'ar') => {
    const isRtl = language === 'ar';
    // Mapping Cairo/Egypt specific environmental context
    const governorateData: Record<string, any> = {
      'Cairo': { density: 'high', focus: 'Air Quality & Transport', tip: isRtl ? 'القاهرة تعاني من كثافة مرورية؛ استخدام المترو يقلل بصمتك بنسبة 60%.' : 'Cairo has high traffic density; using the Metro reduces your footprint by 60%.' },
      'Alexandria': { density: 'medium', focus: 'Marine & Waste', tip: isRtl ? 'الإسكندرية مدينة ساحلية؛ تجنب البلاستيك أحادي الاستخدام لحماية البحر المتوسط.' : 'Alexandria is coastal; avoid single-use plastics to protect the Mediterranean.' },
      'Giza': { density: 'high', focus: 'Green Spaces & Heritage', tip: isRtl ? 'الجيزة منطقة سياحية وزراعية؛ الحفاظ على المساحات الخضراء يحسن جودة الهواء المحيط بك.' : 'Giza is a tourist & agri hub; preserving green spaces improves your local air quality.' },
      'Luxor': { density: 'low', focus: 'Solar & Heritage', tip: isRtl ? 'الأقصر عاصمة الطاقة الشمسية؛ فكر في تركيب ألواح شمسية لتوفير 40% من الفاتورة.' : 'Luxor is the solar capital; consider solar panels to save 40% on your bill.' }
    };

    const data = governorateData[governorate] || { tip: isRtl ? 'كن قدوة بيئية في منطقتك اليوم!' : 'Be an eco-role model in your area today!' };
    return data.tip;
  },

  getEmergencyBriefing: async (alerts: any[], news: any[], language: string = 'ar') => {
    const isRtl = language === 'ar';
    const now = new Date();
    const month = now.getMonth(); 
    
    // 1. Build a smart seasonal context
    let seasonalContext = '';
    if (month >= 2 && month <= 4) {
      seasonalContext = isRtl ? '⚠️ تنبيه موسمي: نحن في فصل الربيع، توقع نشاطاً لرياح الخماسين المحملة بالأتربة.' : '⚠️ Seasonal Update: It is Spring, expect Khamsin dust storms activity.';
    } else if (month >= 5 && month <= 8) {
       seasonalContext = isRtl ? '☀️ تنبيه موسمي: ذروة الصيف، يرجى ترشيد استهلاك الكهرباء لتخفيف الأحمال.' : '☀️ Seasonal Update: Summer peak, please conserve electricity to reduce grid loads.';
    } else if (month >= 9 && month <= 11) {
      seasonalContext = isRtl ? '🌧️ تنبيه موسمي: موسم الأمطار، تأكد من سلامة العمال والأسلاك الكهربائية المكشوفة.' : '🌧️ Seasonal Update: Rainy season, ensure safety of outdoor wires and workers.';
    }

    if (alerts.length === 0 && news.length === 0) {
      return seasonalContext || (isRtl ? "الحالة المستقرة: لا توجد تهديدات بيئية نشطة حالياً." : "Status Stable: No active environmental threats currently.");
    }

    // 2. Intelligent Category Analysis (Logic-based, No external AI cost)
    const criticalCount = alerts.filter(a => a.severity === 'critical').length;
    const airQualityAlerts = alerts.filter(a => a.category === 'environmental' || a.title?.ar?.includes('هواء') || a.title?.en?.includes('air'));
    const fireAlerts = alerts.filter(a => a.category === 'gas' || a.title?.ar?.includes('حريق') || a.title?.en?.includes('fire'));

    let briefing = "";
    
    if (criticalCount > 0) {
      briefing += isRtl 
        ? `🚨 طوارئ قصوى: تم رصد ${criticalCount} إنذارات حرجة تتطلب حذراً شديداً من قبل "المحلل الذكي". ` 
        : `🚨 Emergency: ${criticalCount} critical alerts detected by Smart Analyzer. `;
    }

    if (airQualityAlerts.length > 0) {
       briefing += isRtl
         ? "😷 تحذير تنفسي: جودة الهواء تتدهور في بعض المناطق، ننصح الفئات الحساسة بالبقاء في الخارج واستخدام الكمامة. "
         : "😷 Respiratory Warning: Air quality is degrading in some areas, vulnerable groups should stay indoors. ";
    }

    if (fireAlerts.length > 0) {
       briefing += isRtl
         ? "🔥 خطر حريق: تم الإبلاغ عن حرائق نشطة أو تسرب غاز، اتبع تعليمات الدفاع المدني وابتعد عن مناطق الخطر. "
         : "🔥 Fire Risk: Active fires or gas leaks reported, follow civil defense instructions and stay clear. ";
    }

    if (news.length > 0) {
        briefing += isRtl
          ? `📝 تحديث إخباري: هناك ${news.length} أخبار بيئية جديدة قيد المتابعة. `
          : `📝 News Update: ${news.length} new environmental reports are being monitored. `;
    }

    // Combine with seasonal advice
    return briefing || (isRtl ? `✅ الحالة عامةً مستقرة اليوم. ${seasonalContext}` : `✅ Overall status is stable today. ${seasonalContext}`);
  },
  
  analyzeFootprint: async (impact: number, language: string = 'ar'): Promise<{message: string, score: number}> => {
      const isRtl = language === 'ar';
      if (impact <= 5) {
          return { message: isRtl ? 'ممتاز! بصمتك منخفضة جداً.' : 'Excellent! Your footprint is very low.', score: 95 };
      } else if (impact <= 15) {
          return { message: isRtl ? 'جيد جداً! يمكنك التحسين أكثر.' : 'Very good! You can improve further.', score: 75 };
      } else if (impact <= 30) {
          return { message: isRtl ? 'متوسط. الانتباه لاستهلاكك سيحدث فرقاً.' : 'Average. Monitoring your usage will make a difference.', score: 50 };
      } else {
          return { message: isRtl ? 'تحذير: الأثر الكربوني مرتفع. حاول تقليل الاستهلاك.' : 'Warning: High carbon impact. Please try to reduce consumption.', score: 30 };
      }
  },

  predictTrend: async (userId: string, language: string = 'ar') => {
    try {
      const isRtl = language === 'ar';
      // Basic Smart logic: Look at last 7 days and see if they are going up or down.
      const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: records } = await supabase
        .from('consumption_records')
        .select('value, co2, created_at')
        .eq('user_id', userId)
        .gte('created_at', lastWeek)
        .order('created_at', { ascending: true });
        
      if (!records || records.length < 2) {
         return isRtl 
           ? "توقع المحلل الذكي: نحن بحاجة للمزيد من البيانات. يرجى تسجيل استهلاكك اليومي لنتمكن من توجيهك."
           : "Smart prediction: Needs more data. Please log your daily usage so we can guide you.";
      }
      
      const firstHalf = records.slice(0, Math.floor(records.length / 2));
      const secondHalf = records.slice(Math.floor(records.length / 2));
      
      const firstSum = firstHalf.reduce((sum: number, r: any) => sum + (r.co2 || 0), 0) / firstHalf.length;
      const secondSum = secondHalf.reduce((sum: number, r: any) => sum + (r.co2 || 0), 0) / secondHalf.length;

      if (secondSum > firstSum * 1.2) {
         return isRtl 
           ? "توقع المحلل الذكي ⚠️: استهلاكك في اتجاه تصاعدي. ننصح بترشيد الاستهلاك هذا الأسبوع لتجنب زيادة الفاتورة."
           : "Smart Prediction ⚠️: Your consumption is trending upwards. We advise conserving energy to avoid higher bills.";
      } else if (secondSum < firstSum * 0.8) {
         return isRtl
           ? "توقع المحلل الذكي 🌟: استهلاكك في انخفاض! استمر على هذا المنوال وستوفر في فاتورتك القادمة."
           : "Smart Prediction 🌟: Your consumption is decreasing! Keep it up and you will save on your next bill.";
      } else {
         return isRtl
           ? "توقع المحلل الذكي 📊: استهلاكك مستقر نسبياً. جرب فصل الأجهزة في أوقات الذروة لتنتقل لمرحلة التوفير."
           : "Smart Prediction 📊: Your consumption is stable. Try unplugging devices during peak hours to start saving.";
      }

    } catch(e) {
       console.warn("Predict API error", e);
       return language === 'ar' ? 'المحلل الذكي يعمل الأن على معالجة بياناتك.' : 'Smart analyzer is processing your data.';
    }
  },

  getEcoAssistantResponse: async (query: string, language: string = 'ar') => {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    const isRtl = language === 'ar';

    try {
      // Using free models from OpenRouter 
      const models = [
        "mistralai/mistral-7b-instruct:free",
        "huggingfaceh4/zephyr-7b-beta:free"
      ];

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey || ''}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
          "X-Title": "MoEco Smart Assistant"
        },
        body: JSON.stringify({
          "model": models[0],
          "messages": [
            {
              "role": "system",
              "content": isRtl 
                ? "أنت 'مو-إيكو'، مساعد ذكي متخصص في الاستدامة والبيئة في مصر. أجب دائماً بالعربية بلهجة مصرية ودودة وتقنية. ركز على الحلول العملية المنزلية، توفير فواتير الكهرباء والمياه، والزراعة في البلكونة. لا تطيل في الإجابة." 
                : "You are 'MoEco', a smart sustainability assistant in Egypt. Answer in an Egyptian friendly tech expert tone. Focus on practical home solutions, saving utility bills, and balcony gardening. Keep it concise."
            },
            {"role": "user", "content": query}
          ]
        })
      });

      if (!response.ok) throw new Error("API call failed");

      const data = await response.json();
      if (data && data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content;
      }
      return aiService.getLocalFallbackResponse(query, language);
    } catch (error) {
      console.error("AI Assistant Error:", error);
      return aiService.getLocalFallbackResponse(query, language);
    }
  },

  getLocalFallbackResponse: (query: string, language: string = 'ar') => {
    const q = query.toLowerCase();
    const isRtl = language === 'ar';
    
    // Core logic keywords for local rule matching
    if (q.includes('كهرباء') || q.includes('electricity') || q.includes('فاتورة') || q.includes('bill') || q.includes('توفير')) {
      return isRtl 
        ? "لتقليل فاتورة الكهرباء في مصر: اضبط التكييف على 24 درجة، استبدل اللمبات بأخرى LED، وافصل شواحن الهواتف والأجهزة من القابس عند عدم الاستخدام. يمكنك أيضاً استخدام خاصية قارئ العداد في التطبيق لمتابعة استهلاكك."
        : "To reduce electricity bills in Egypt: Set AC to 24°C, use LED bulbs, and unplug chargers/devices when not in use. You can also use the AI Meter Scanner in this app to monitor consumption daily.";
    }

    if (q.includes('ماء') || q.includes('water') || q.includes('مياه') || q.includes('ترشيد')) {
      return isRtl
        ? "لترشيد استهلاك المياه: ركب قطع توفير المياه على الحنفيات، تأكد من إصلاح أي تسريب فوراً، ولا تترك المياه جارية أثناء غسل الأطباق أو تنظيف الأسنان. المياه كنز حافظ عليه!"
        : "To save water: Install aerators on faucets, fix leaks immediately, and don't keep water running while washing dishes or brushing teeth. Water is life, conserve it!";
    }

    if (q.includes('زراعة') || q.includes('نبات') || q.includes('plant') || q.includes('بلكونة') || q.includes('garden')) {
      return isRtl
        ? "للبدء في الزراعة المنزلية بمصر: ابدأ بالريحان أو النعناع؛ فهما يتحملان حرارة الصيف والري المنتظم. استخدم تفل القهوة كسماد طبيعي وقشور البيض لتقوية التربة بالكالسيوم."
        : "For home gardening in Egypt: Start with Mint or Basil; they survive the summer heat with regular watering. Use coffee grounds as natural fertilizer and eggshells for calcium boost.";
    }

    if (q.includes('جواز') || q.includes('passport') || q.includes('بطاقة') || q.includes('id card') || q.includes('خدمات') || q.includes('حكومية')) {
      return isRtl
        ? "يمكنك الحصول على أغلب الخدمات الحكومية المصرية عبر منصة 'مصر الرقمية'. تأكد من وجود بطاقة رقم قومي سارية وإيصال مرافق حديث عند التوجه لأي مصلحة حكومية. كما يمكنك متابعة خطواتك في تبويب 'خدمات ذكية' بالتطبيق."
        : "Most Egyptian gov services are available on 'Digital Egypt' platform. Ensure you have a valid National ID and a recent utility bill before visiting any office. You can track service steps in the 'Smart Gov' section of this app.";
    }

    if (q.includes('بصمة') || q.includes('carbon') || q.includes('كربون') || q.includes('بيئة')) {
        return isRtl
          ? "بصمتك الكربونية هي مجموع الانبعاثات الناتجة عن أنشطتك اليومية. يمكنك تقليلها عبر استخدام المواصلات العامة، تقليل استهلاك اللحوم الحمراء، وإعادة تدوير المخلفات الصلبة. كل فعل صغير يفرق!"
          : "Your carbon footprint is the total emissions from your daily actions. Reduce it by using public transit, cutting red meat consumption, and recycling waste. Every small action makes a difference!";
    }
    
    return isRtl
      ? "مرحباً! أنا مساعدك البيئي الذكي في مصر. يمكنني مساعدتك في نصائح توفير الكهرباء والمياه، الزراعة المنزلية، أو معرفة الأوراق المطلوبة للخدمات الحكومية. كيف يمكنني مساعدتك اليوم؟"
      : "Hello! I am your Smart Eco Assistant in Egypt. I can help with saving electricity/water, home gardening tips, or knowing required documents for gov services. How can I help you today?";
  },

  /**
   * AI SCREEN EXPLANATION SYSTEM
   * Simulates AI interpretation of the current screen to provide accessible descriptions and video.
   * Leverages HuggingFace/Groq concepts as a fallback, checking supabase first.
   */
  async generateScreenExplanation(path: string, lang: 'ar' | 'en') {
    try {
      const { data, error } = await supabase
        .from('accessibility_guides')
        .select('*')
        .eq('path', path.split('?')[0]) // Ignore query params
        .single();
        
      if (data && !error) {
        return {
          title: lang === 'ar' ? data.title_ar : data.title_en,
          description: lang === 'ar' ? data.description_ar : data.description_en,
          videoUrl: data.video_url || 'https://www.w3schools.com/html/mov_bbb.mp4'
        };
      }
    } catch (err) {
      // Graceful fallback to static dictionary mimicking AI parsing
    }

    const contextMap: Record<string, { ar: any, en: any }> = {
      '/': {
        ar: { title: 'الرئيسية', description: 'هذه هي الشاشة الرئيسية، تتيح لك الوصول لجميع خدمات مو-إيكو من مكان واحد', videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4' },
        en: { title: 'Home', description: 'This is the Home screen. From here you can access all Mo-Eco services.', videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4' }
      },
      '/gov': {
        ar: { title: 'الخدمات الحكومية', description: 'اضغط هنا لاختيار الخدمة الحكومية التي ترغب بها ثم يمكنك فتح الرابط الرسمي من خلالها.', videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4' },
        en: { title: 'Gov Services', description: 'Select a government service to open the official portal.', videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4' }
      },
      '/calculator': {
        ar: { title: 'حاسبة البصمة', description: 'أدخل استهلاكك من الكهرباء والغاز في هذه الشاشة ثم اضغط حساب لمعرفة الانبعاثات وفروق التوفير.', videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4' },
        en: { title: 'Calculate Footprint', description: 'Enter energy consumption and hit calculate to view emissions and savings.', videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4' }
      },
      '/login': {
        ar: { title: 'تسجيل الدخول', description: 'قم بإدخال بريدك الإلكتروني وكلمة المرور للوصول لحسابك. أو اضغط على إنشاء حساب لعمل حساب جديد.', videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4' },
        en: { title: 'Login', description: 'Enter your email and password to log in. Click Create Account to make a new one.', videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4' }
      },
      '/register': {
        ar: { title: 'إنشاء حساب جديد', description: 'ادخل بياناتك الشخصية كمستخدم جديد لبدء استخدام المنصة.', videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4' },
        en: { title: 'Create Account', description: 'Enter your personal details to start using the platform.', videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4' }
      },
      '/alerts': {
         ar: { title: 'التحذيرات والطوارئ', description: 'هنا يمكنك متابعة التحذيرات المناخية والإبلاغ عن حالات الطوارئ في منطقتك.', videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4' },
         en: { title: 'Alerts & Emergencies', description: 'Track climate alerts and report local emergencies here.', videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4' }
      },
    };

    const cleanPath = path.split('?')[0];
    const match = Object.keys(contextMap).find(key => cleanPath === key || (key !== '/' && cleanPath.startsWith(key)));
    const selected = match ? contextMap[match][lang] : {
      title: lang === 'ar' ? 'مساعد لغة الإشارة' : 'Sign Language Guide',
      description: lang === 'ar' 
        ? 'أنا المساعد الذكي الخاص بك، أنا هنا لأشرح لك محتوى هذه الشاشة لمساعدتك على تصفح التطبيق بسهولة. يمكنك التفاعل مع جميع العناصر بشكل مبسط.' 
        : 'I am your smart assistant, explaining every step on this screen so you can browse the app easily.',
      videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4'
    };

    return selected;
  }
};
