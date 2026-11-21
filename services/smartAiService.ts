
export const smartAiService = {
  generateDailyContent: async (type: 'food' | 'agriculture' | 'mission' | 'investment' | 'story', language: 'ar' | 'en' = 'ar') => {
    // Completely replaced remote AI APIs with a local heuristic engine that rotates daily based on local patterns
    const isAr = language === 'ar';
    const dayIndex = new Date().getDay();
    
    switch (type) {
        case 'mission':
          const missions = [
            { title: isAr ? "دراجة اليوم" : "Bike Today", description: isAr ? "استخدم الدراجة بدلاً من السيارة للرحلات القصيرة." : "Use a bike for short trips.", points: 80, category: "transport" },
            { title: isAr ? "يوم بدون بلاستيك" : "Plastic-Free Day", description: isAr ? "تجنب شراء أي منتج ببلاستيك أحادي الاستخدام اليوم." : "Avoid single-use plastic today.", points: 60, category: "recycling" },
            { title: isAr ? "إطفاء الأنوار" : "Lights Out", description: isAr ? "أطفئ الأنوار في الغرف غير المستخدمة." : "Turn off lights in unused rooms.", points: 30, category: "electricity" }
          ];
          return missions[dayIndex % missions.length];
        
        case 'food':
          const foods = [
            { tip: isAr ? "العدس منخفض الكربون" : "Low-Carbon Lentils", recipe: { title: isAr ? "شوربة عدس" : "Lentil Soup", ingredients: isAr ? ["عدس", "جزر", "بصل"] : ["Lentils", "Carrots", "Onion"], instructions: isAr ? "استخدم الحلة الكاتمة للحرارة لتقليل وقت الطبخ." : "Use a pressure cooker to reduce cooking time." } },
            { tip: isAr ? "أكل نباتي ليوم" : "Vegan for a Day", recipe: { title: isAr ? "مسقعة بدون لحم" : "Meatless Moussaka", ingredients: isAr ? ["باذنجان", "طماطم", "فلفل"] : ["Eggplant", "Tomatoes", "Peppers"], instructions: isAr ? "اشوي الباذنجان بدلاً من قليه." : "Grill eggplant instead of frying." } }
          ];
          return foods[dayIndex % foods.length];
          
        case 'agriculture':
          const plants = [
            { tip: isAr ? "زراعة الريحان" : "Grow Basil", seasonal_plant: isAr ? "ريحان" : "Basil", instructions: isAr ? "يحتاج شمس مباشرة وماء معتدل." : "Needs direct sun and moderate water." },
            { tip: isAr ? "الطماطم الكرزية" : "Cherry Tomatoes", seasonal_plant: isAr ? "طماطم" : "Tomatoes", instructions: isAr ? "ازرعها في وعاء عميق وضعها في البلكونة." : "Plant in a deep pot on the balcony." }
          ];
          return plants[dayIndex % plants.length];
          
        case 'investment':
          const investments = [
            { insight: isAr ? "الطلب على السماد العضوي يرتفع." : "Demand for organic compost is rising.", project_idea: isAr ? "مشروع كومبوست منزلي" : "Home Composting Project", potential_impact: isAr ? "تحويل 50% من نفاياتك العضوية" : "Divert 50% of organic waste" },
            { insight: isAr ? "الطاقة الشمسية تشهد نمواً." : "Solar is booming.", project_idea: isAr ? "سخان مياه شمسي" : "Solar Water Heater", potential_impact: isAr ? "توفير 30% من فاتورة الكهرباء" : "Save 30% on electricity bill" }
          ];
          return investments[dayIndex % investments.length];
          
        case 'story':
          return {
            title: isAr ? "بطل إعادة التدوير" : "The Recycling Hero",
            content: isAr ? "في قرية صغيرة، بدأ أدهم بتدوير البلاستيك المشكل، وسرعان ما تبعه الجميع." : "In a small village, Adham started recycling plastic, soon everyone followed.",
            lesson: isAr ? "التغيير يبدأ بفرد." : "Change starts with one person."
          };
        default:
          return {};
    }
  },

  getGovernmentGuidance: async (serviceKey: string, language: 'ar' | 'en' = 'ar') => {
    const isAr = language === 'ar';
    return {
      docs: isAr ? ["البطاقة الشخصية", "إيصال مرافق"] : ["National ID", "Utility Bill"],
      tips: isAr ? "تأكد من سريان الأوراق قبل الذهاب." : "Ensure documents are valid before going."
    };
  },

  classifySeverity: async (description: string, language: string = 'ar') => {
    // Pure algorithmic heuristic for severity based on keyword matching
    const descLower = description.toLowerCase();
    
    const criticalKeywords = ['حريق', 'تسرب', 'غاز', 'انفجار', 'سام', 'خطر', 'fire', 'leak', 'gas', 'explosion', 'toxic', 'danger', 'chemical'];
    const highKeywords = ['كثيف', 'مستمر', 'كبير', 'تلوث', 'مصنع', 'heavy', 'continuous', 'large', 'pollution', 'factory', 'spill'];
    const mediumKeywords = ['قمامة', 'نفايات', 'رائحة', 'صوت', 'إزعاج', 'garbage', 'waste', 'smell', 'noise', 'disturbance'];
    
    let severity = 'low';
    
    for (const kw of criticalKeywords) {
      if (descLower.includes(kw)) return 'critical';
    }
    for (const kw of highKeywords) {
      if (descLower.includes(kw)) severity = 'high';
    }
    if (severity !== 'high') {
      for (const kw of mediumKeywords) {
        if (descLower.includes(kw)) severity = 'medium';
      }
    }
    
    return severity;
  }
};


