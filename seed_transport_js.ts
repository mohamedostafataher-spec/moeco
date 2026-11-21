import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!.replace(/\/rest\/v1\/?$/, ''),
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!
);

const transportData = [
  {
    id: 'ef85ad1c-d06f-41ae-a854-3fc9bbb24612',
    name: 'الخط الأول للمترو (حلوان - المرج)',
    type: 'metro',
    route_name: 'metro_l1',
    price: 10,
    carbon_impact_kg: 0.040,
    live_status: 'active',
    stops: ['حلوان', 'عين حلوان', 'جامعة حلوان', 'المعادي', 'زهراء المعادي', 'دار السلام', 'مار جرجس', 'السيدة زينب', 'السادات', 'جمال عبد الناصر', 'عرابي', 'الشهداء', 'غمرة', 'الدمرداش', 'منشية الصدر', 'كوبري القبة', 'حمامات القبة', 'سراي القبة', 'حدائق الزيتون', 'المطرية', 'عين شمس', 'عزبة النخل', 'المرج', 'المرج الجديدة'],
    current_location: { lat: 30.0444, lng: 31.2357 },
    service_name: 'Cairo Metro Line 1 (Helwan - Marg)',
    service_type: 'metro',
    base_fare: 10,
    coverage_area: 'Greater Cairo (Cairo, Giza, Qalyubia)'
  },
  {
    id: 'a376b8b2-f64d-4639-8e8e-d03c3f09122b',
    name: 'الخط الثاني للمترو (شبرا - المنيب)',
    type: 'metro',
    route_name: 'metro_l2',
    price: 10,
    carbon_impact_kg: 0.040,
    live_status: 'active',
    stops: ['شبرا الخيمة', 'كلية الزراعة', 'المظلات', 'الخلفاوي', 'سانت تريزا', 'روض الفرج', 'مسرة', 'الشهداء', 'العتبة', 'محمد نجيب', 'السادات', 'الأوبرا', 'الدقي', 'البحوث', 'جامعة القاهرة', 'فيصل', 'الجيزة', 'أم المصريين', 'ساقية مكي', 'المنيب'],
    current_location: { lat: 30.0636, lng: 31.2467 },
    service_name: 'Cairo Metro Line 2 (Shobra - Mounib)',
    service_type: 'metro',
    base_fare: 10,
    coverage_area: 'Greater Cairo (Cairo, Giza, Qalyubia)'
  },
  {
    id: '9a1dc1d7-1fef-486f-a9bb-3d2fb6fd9cb1',
    name: 'الخط الثالث للمترو (عدلي منصور - الكيت كات)',
    type: 'metro',
    route_name: 'metro_l3',
    price: 10,
    carbon_impact_kg: 0.040,
    live_status: 'active',
    stops: ['عدلي منصور', 'الهايكستب', 'عمر بن الخطاب', 'قباء', 'هشام بركات', 'النزهة', 'نادي الشمس', 'ألف مسكن', 'مصر الجديدة', 'هارون', 'الأهرام', 'كلية البنات', 'الاستاد', 'أرض المعارض', 'العباسية', 'عبده باشا', 'الجيش', 'باب الشعرية', 'العتبة', 'جمال عبد الناصر', 'ماسبيرو', 'صفاء حجازي', 'الكيت كات'],
    current_location: { lat: 30.0519, lng: 31.2464 },
    service_name: 'Cairo Metro Line 3 (Green Line)',
    service_type: 'metro',
    base_fare: 10,
    coverage_area: 'Greater Cairo (Cairo, Giza)'
  },
  {
    id: '4ae3c7e5-2702-454c-8761-dca79243a0c8',
    name: 'الخط الرابع للمترو (حدائق الأشجار - الفسطاط)',
    type: 'metro',
    route_name: 'metro_l4',
    price: 15,
    carbon_impact_kg: 0.040,
    live_status: 'active',
    stops: ['حدائق الأشجار', 'حدائق الأهرام', 'النصر', 'المتحف المصري الكبير', 'الرماية', 'الأهرامات', 'المريوطية', 'العروبة', 'المطبعة', 'الطالبية', 'مدكور', 'المساحة', 'الجيزة', 'ميدان الجيزة', 'الروضة', 'الملك الصالح', 'الفسطاط'],
    current_location: { lat: 29.9954, lng: 31.1152 },
    service_name: 'Cairo Metro Line 4 (Pharaonic Line)',
    service_type: 'metro',
    base_fare: 15,
    coverage_area: 'Giza, Pyramids, October 6'
  },
  {
    id: 'cee44cfa-d5f4-4bf2-b8ff-650a132bfc19',
    name: 'مونوريل شرق النيل (الاستاد - العاصمة الإدارية)',
    type: 'monorail',
    route_name: 'monorail_east',
    price: 20,
    carbon_impact_kg: 0.030,
    live_status: 'active',
    stops: ['الاستاد', 'هشام بركات', 'جامعة الأزهر', 'المشير أحمد إسماعيل', 'الحي السابع', 'جيهان السادات', 'المشير طنطاوي', 'وان ناينتي', 'المستشفى الجوي', 'النرجس', 'المستثمرين', 'اللوتس', 'جولدن سكوير', 'بيت الوطن', 'مسجد الفتاح العليم', 'الحي السكني R1', 'الحي السكني R2', 'حي المال والأعمال', 'مدينة الفنون والثقافة', 'مسجد مصر', 'الحي الحكومي', 'مدينة العدالة'],
    current_location: { lat: 30.0712, lng: 31.3258 },
    service_name: 'East Nile Monorail (Stadium - Administrative Capital)',
    service_type: 'monorail',
    base_fare: 20,
    coverage_area: 'Cairo, New Cairo, Administrative Capital'
  },
  {
    id: '897dd7b2-c0e4-46df-a8b2-b12e3f4da891',
    name: 'مونوريل غرب النيل (وادي النيل - أكتوبر الجديدة)',
    type: 'monorail',
    route_name: 'monorail_west',
    price: 20,
    carbon_impact_kg: 0.030,
    live_status: 'active',
    stops: ['وادي النيل', 'بشتيل', 'الطريق الدائري', 'المريوطية', 'المنصورية', 'طريق الإسكندرية الصحراوي', 'الشيخ زايد', 'مول مصر', 'نادي نقابة المهندسين', 'جامعة 6 أكتوبر', 'السادات', 'جامعة الأهرام الكندية', 'أكتوبر الجديدة'],
    current_location: { lat: 30.0642, lng: 31.1982 },
    service_name: 'West Nile Monorail (Wadi El-Nile - New October)',
    service_type: 'monorail',
    base_fare: 20,
    coverage_area: 'Giza, Sheikh Zayed, October 6'
  },
  {
    id: '7892b1da-f155-4422-91f1-33124df8ac12',
    name: 'القطار الكهربائي الخفيف (LRT)',
    type: 'lrt',
    route_name: 'lrt_egypt',
    price: 10,
    carbon_impact_kg: 0.035,
    live_status: 'active',
    stops: ['عدلي منصور', 'العبور', 'المستقبل', 'الشروق', 'هليوبوليس الجديدة', 'بدر', 'الروبيكي', 'نيو كابيتال 1', 'نيو كابيتال 2'],
    current_location: { lat: 30.145, lng: 31.406 },
    service_name: 'Light Rail Transit (LRT)',
    service_type: 'lrt',
    base_fare: 10,
    coverage_area: 'Cairo, Shorouk, Badr, New Capital'
  },
  {
    id: '5b172a91-faab-467f-972a-9e12ff48123a',
    name: 'الأوتوبيس الترددي السريع (BRT) - الطريق الدائري',
    type: 'bus',
    route_name: 'brt_ring_road',
    price: 15,
    carbon_impact_kg: 0.050,
    live_status: 'active',
    stops: ['المشير طنطاوي', 'كايرو فيستيفال سيتي', 'أكاديمية الشرطة', 'طريق السويس', 'عدلي منصور', 'موقف العاشر', 'مؤسسة الزكاة', 'مدينة السلام', 'المرج', 'مسطرد', 'بهتيم', 'طريق الإسكندرية الزراعي', 'قليوب', 'الوراق', 'محور روض الفرج', 'بشتيل', 'صفط اللبن', 'المريوطية', 'الهرم', 'فيصل', 'المتحف المصري الكبير', 'المنيب', 'البحر الأعظم', 'زهراء المعادي', 'القطامية', 'كارفور المعادي', 'الأوتوستراد'],
    current_location: { lat: 30.035, lng: 31.405 },
    service_name: 'Bus Rapid Transit (BRT) - Ring Road',
    service_type: 'bus',
    base_fare: 15,
    coverage_area: 'Ring Road Highway (Greater Cairo)'
  },
  {
    id: 'c88e7ab2-f472-4d22-811c-d78aa1219b16',
    name: 'مواصلات مصر (النقل الذكي)',
    type: 'bus',
    route_name: 'smart_transport_mwasalat',
    price: 15,
    carbon_impact_kg: 0.060,
    live_status: 'active',
    stops: ['مطار القاهرة', 'مصر الجديدة', 'العباسية', 'رمسيس', 'التحرير'],
    current_location: { lat: 30.121, lng: 31.406 },
    service_name: 'Mwasalat Misr Smart Bus',
    service_type: 'bus',
    base_fare: 15,
    coverage_area: 'Cairo, Heliopolis, Giza'
  },
  {
    id: 'a87f1cb2-2e11-4775-812d-a1288cd916c2',
    name: 'ترام الإسكندرية (الخط الأزرق)',
    type: 'tram',
    route_name: 'alex_tram_blue',
    price: 5,
    carbon_impact_kg: 0.020,
    live_status: 'active',
    stops: ['محطة الرمل', 'مصطفى كامل', 'سيدي جابر', 'بولكلي', 'رشدي', 'فيكتوريا'],
    current_location: { lat: 31.200, lng: 29.899 },
    service_name: 'Alexandria Tram (Blue Line)',
    service_type: 'tram',
    base_fare: 5,
    coverage_area: 'Alexandria Governorate (Coastal)'
  }
];

async function runSeed() {
  console.log('Seeding transport services directly via Supabase client JS upsert...');
  
  const { data, error } = await supabase
    .from('transport_services')
    .upsert(transportData, { onConflict: 'id' });

  if (error) {
    console.error('Seeding encountered an error:', error);
  } else {
    console.log('Successfully completed seeding transport services with both older and newer formats in tact!');
  }
}

runSeed();
