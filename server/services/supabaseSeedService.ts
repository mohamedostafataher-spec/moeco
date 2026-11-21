
import { supabase } from './supabaseClient.ts';

export const supabaseSeedService = {
  async seedAll() {
    console.log('--- STARTING SUPABASE DEEP SEED ---');
    try {
      await Promise.all([
        this.seedSectors(),
        this.seedGovernorates(),
        this.seedGuides(),
        this.seedFactors(),
        this.seedDestinations(),
        this.seedStrings(),
        this.seedFaqs(),
        this.seedGovDecisions()
      ]);
      console.log('--- SUPABASE DEEP SEED COMPLETED ---');
      return { success: true };
    } catch (error) {
      console.error('Supabase seeding failed:', error);
      return { success: false, error };
    }
  },

  async seedGovDecisions() {
    const decisions = [
      { key: 'decision_1', category: 'gov_decision', value: { title: 'Mandatory Solar for New Buildings', content: 'All new administrative buildings must install solar panels.', sector: 'Energy', isEncrypted: false } },
      { key: 'decision_2', category: 'gov_decision', value: { title: 'Cairo Metro Expansion Phase 4', content: 'Green financing approved for Line 3 expansion.', sector: 'Transport', isEncrypted: true } }
    ];
    await supabase.from('scientific_data').upsert(decisions, { onConflict: 'key' });
  },

  async seedSectors() {
    const sectors = [
      { name_en: "Electricity", name_ar: "الكهرباء", icon: "Zap", color: "#FBBF24", unit: "kWh" },
      { name_en: "Water", name_ar: "المياه", icon: "Droplets", color: "#3B82F6", unit: "m3" },
      { name_en: "Transport", name_ar: "النقل", icon: "Car", color: "#EF4444", unit: "km" },
      { name_en: "Waste", name_ar: "النفايات", icon: "Trash2", color: "#10B981", unit: "kg" },
      { name_en: "Agriculture", name_ar: "الزراعة", icon: "Leaf", color: "#8B5CF6", unit: "kg" },
    ];
    const { error } = await supabase.from('sectors').upsert(sectors, { onConflict: 'name_en' });
    if (error) console.warn('Sectors seed warn:', error.message);
  },

  async seedGovernorates() {
    const governorates = [
      { name_en: "Cairo", name_ar: "القاهرة", latitude: 30.0444, longitude: 31.2357 },
      { name_en: "Alexandria", name_ar: "الإسكندرية", latitude: 31.2001, longitude: 29.9187 },
      { name_en: "Giza", name_ar: "الجيزة", latitude: 30.0131, longitude: 31.2089 },
      { name_en: "Aswan", name_ar: "أسوان", latitude: 24.0889, longitude: 32.8998 },
      { name_en: "Luxor", name_ar: "الأقصر", latitude: 25.6872, longitude: 32.6396 }
    ];
    const { error } = await supabase.from('governorates').upsert(governorates, { onConflict: 'name_en' });
    if (error) console.warn('Governorates seed warn:', error.message);
  },

  async seedGuides() {
    const guides = [
        { 
          slug: 'transport-tips', 
          title_ar: 'نصائح النقل الذكي', 
          title_en: 'Smart Transport Tips',
          steps_ar: ['استخدم المترو في ساعات الذروة', 'جرب المشي في المسافات القصيرة', 'شارك سيارتك مع زملاء العمل'],
          steps_en: ['Use the Metro during peak hours', 'Try walking for short distances', 'Carpool with colleagues']
        },
        { 
          slug: 'energy-saving', 
          title_ar: 'توفير الكهرباء', 
          title_en: 'Energy Saving',
          steps_ar: ['استخدم لمبات ليد', 'افصل الأجهزة غير المستخدمة', 'استغل ضوء النهار'],
          steps_en: ['Use LED bulbs', 'Unplug unused appliances', 'Utilize natural light']
        }
    ];
    await supabase.from('egypt_guides').upsert(guides, { onConflict: 'slug' });
  },

  async seedFactors() {
    const factors = [
      { name: 'Electricity', factor: 0.533 },
      { name: 'Water', factor: 0.298 },
      { name: 'Petrol', factor: 2.31 },
      { name: 'Natural Gas', factor: 1.9 }
    ];
    await supabase.from('commodity_carbon_factors').upsert(factors, { onConflict: 'name' });
  },

  async seedDestinations() {
    const destinations = [
        { 
          id: 'siwa-001',
          name_en: "Siwa Oasis", 
          name_ar: "واحة سيوة", 
          category: "Protected Area", 
          description_en: "A natural wonder with salt lakes, ancient mud-brick fortresses, and unique eco-lodges built with traditional 'Kershef' material.",
          description_ar: "معجزة طبيعية تضم بحيرات ملحية، وقلاع قديمة من الطوب اللبن، ونزل بيئية فريدة مبنية بمواد 'الكرشيف' التقليدية.",
          location_coords: { lat: 29.2032, lng: 25.5195 },
          image_url: "https://images.unsplash.com/photo-1544971587-b842c27f8e14?q=80&w=800&auto=format&fit=crop",
          green_points_reward: 50
        },
        { 
          id: 'wadi-gemal',
          name_en: "Wadi El Gemal", 
          name_ar: "وادي الجمال", 
          category: "Protected Area", 
          description_en: "A stunning national park featuring diverse wildlife, ancient emerald mines, and pristine Red Sea coastlines.",
          description_ar: "محمية وطنية مذهلة تضم حياة برية متنوعة، مناجم زمرد قديمة، وشواطئ بكر على ساحل البحر الأحمر.",
          location_coords: { lat: 24.6545, lng: 35.0934 },
          image_url: "https://images.unsplash.com/photo-1506461883276-594a12b11cf3?q=80&w=800&auto=format&fit=crop",
          green_points_reward: 60
        },
        { 
          id: 'st-catherine',
          name_en: "Saint Catherine", 
          name_ar: "سانت كاترين", 
          category: "Heritage", 
          description_en: "A UNESCO World Heritage site standing at the foot of Mount Sinai, one of the oldest working Christian monasteries in the world.",
          description_ar: "أحد مواقع التراث العالمي لليونسكو يقع عند سفح جبل سيناء، وهو واحد من أقدم الأديرة المسيحية العاملة في العالم.",
          location_coords: { lat: 28.5559, lng: 33.9519 },
          image_url: "https://images.unsplash.com/photo-1560242208-9634563a6e38?q=80&w=800&auto=format&fit=crop",
          green_points_reward: 45
        },
        { 
          id: 'luxor-karnak',
          name_en: "Karnak Temple", 
          name_ar: "معبد الكرنك", 
          category: "Heritage", 
          description_en: "The largest ancient religious site in the world, showcasing centuries of architectural transformation and history.",
          description_ar: "أكبر موقع ديني قديم في العالم، يعرض قروناً من التحول المعماري والتاريخي.",
          location_coords: { lat: 25.7188, lng: 32.6586 },
          image_url: "https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?q=80&w=800&auto=format&fit=crop",
          green_points_reward: 35
        },
        { 
          id: 'ras-mohammed',
          name_en: "Ras Mohammed", 
          name_ar: "رأس محمد", 
          category: "Protected Area", 
          description_en: "A marine national park at the southern tip of Sinai, world-famous for its spectacular coral reefs and mangroves.",
          description_ar: "محمية بحرية وطنية في الطرف الجنوبي لسيناء، مشهورة عالمياً بشعابها المرجانية الخلابة وغابات المانجروف.",
          location_coords: { lat: 27.7554, lng: 34.2541 },
          image_url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=800&auto=format&fit=crop",
          green_points_reward: 55
        },
        { 
          id: 'nubian-village',
          name_en: "Nubian Village", 
          name_ar: "القرية النوبية", 
          category: "Heritage", 
          description_en: "Experience the colorful culture, unique architecture, and sustainable lifestyle of the Nubian people in Aswan.",
          description_ar: "تجربة الثقافة الملونة، العمارة الفريدة، وأسلوب الحياة المستدام للشعب النوبي في أسوان.",
          location_coords: { lat: 24.0889, lng: 32.8998 },
          image_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop",
          green_points_reward: 40
        }
    ];
    await supabase.from('eco_destinations').upsert(destinations, { onConflict: 'id' });
  },

  async seedStrings() {
    const strings = [
       { string_key: 'app_motto', ar: 'من أجل مصر خضراء', en: 'For a Greener Egypt' },
       { string_key: 'welcome_back', ar: 'أهلاً بك مجدداً', en: 'Welcome Back' }
    ];
    await supabase.from('app_strings').upsert(strings, { onConflict: 'string_key' });
  },

  async seedFaqs() {
      const faqs = [
          { question_ar: 'ما هو مويكو؟', question_en: 'What is MoEco?', answer_ar: 'مويكو هو رفيقك البيئي للتحول الرقمي والأخضر.', answer_en: 'MoEco is your eco-companion for digital and green transformation.' },
          { question_ar: 'كيف أجمع النقاط؟', question_en: 'How to earn points?', answer_ar: 'من خلال تسجيل الأنشطة البيئية وتقليل الاستهلاك.', answer_en: 'By logging eco-activities and reducing consumption.' }
      ];
      await supabase.from('faqs').upsert(faqs, { onConflict: 'question_en' });
  }
};
