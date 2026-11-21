import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Using fallback for local dev. Trying to read .env');
  try {
     const envData = fs.readFileSync('.env', 'utf-8');
     // simple parse (not perfect but works for our vars)
  } catch(e) {}
}

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function run() {
  console.log("Setting up RSS Sources...");
  const rssSources = [
    { name: 'هيئة الأرصاد المصرية', feed_url: 'https://www.youm7.com/rss/356', target_screen: 'emergency', category: 'weather', is_active: true, priority_keywords: ['تحذير', 'أمطار', 'عاصفة'] },
    { name: 'الجزيرة - عاجل', feed_url: 'https://www.aljazeera.net/rss', target_screen: 'emergency', category: 'alerts', is_active: true, priority_keywords: ['عاجل', 'انفجار', 'طوارئ'] },
    { name: 'سكاي نيوز عربية - عاجل', feed_url: 'https://www.skynewsarabia.com/feeds/rss/urgent.xml', target_screen: 'emergency', category: 'alerts', is_active: true, priority_keywords: ['عاجل', 'urgent', 'breaking'] },
    { name: 'اليوم السابع - حوادث', feed_url: 'https://www.youm7.com/rss/203', target_screen: 'emergency', category: 'alerts', is_active: true, priority_keywords: ['حادث', 'تصادم', 'حريق'] },
    { name: 'بي بي سي عربي - أخبار العالم', feed_url: 'https://feeds.bbci.co.uk/arabic/rss.xml', target_screen: 'eco_news', category: 'general', is_active: true, priority_keywords: [] },
    { name: 'العربية - علوم وتقنية', feed_url: 'https://www.alarabiya.net/science-and-tech/rss', target_screen: 'eco_news', category: 'technology', is_active: true, priority_keywords: [] },
    { name: 'Global Disaster Alert (GDACS)', feed_url: 'https://www.gdacs.org/xml/rss.xml', target_screen: 'emergency', category: 'alerts', is_active: true, priority_keywords: ['earthquake', 'flood', 'tsunami', 'disaster'] }
  ];

  for (const source of rssSources) {
    const { error } = await supabase.from('rss_sources').upsert(source, { onConflict: 'feed_url' });
    if (error) {
       console.log('Error inserting RSS:', source.name, error);
       if (error.code === '42P01') {
           console.log("Table rss_sources does not exist!");
       }
    } else {
       console.log('Added RSS:', source.name);
    }
  }

  console.log("Setting up Gov Services...");
  const govServices = [
    { name_ar: 'استكمال عداد كهرباء', name_en: 'Complete Electricity Meter', category: 'Utilities', description_ar: 'خدمات الكهرباء', description_en: 'Electricity Services', icon: 'Zap', url: 'https://digital.gov.eg/utilities/electricity-meter', carbon_impact_kg: 0.5 },
    { name_ar: 'استعلام فاتورة الكهرباء', name_en: 'Electricity Bill Query', category: 'Utilities', description_ar: 'استعلام ودفع الكهرباء', description_en: 'Query and Pay Electricity', icon: 'Zap', url: 'https://digital.gov.eg/utilities/electricity-bill', carbon_impact_kg: 0.1 },
    { name_ar: 'سداد فاتورة المياه', name_en: 'Pay Water Bill', category: 'Utilities', description_ar: 'سداد فواتير المياه', description_en: 'Pay Water Bills', icon: 'Droplets', url: 'https://digital.gov.eg/utilities/water-bill', carbon_impact_kg: 0.1 },
    { name_ar: 'سداد فاتورة الغاز', name_en: 'Pay Gas Bill', category: 'Utilities', description_ar: 'سداد فواتير الغاز', description_en: 'Pay Gas Bills', icon: 'Flame', url: 'https://digital.gov.eg/utilities/gas-bill', carbon_impact_kg: 0.1 },
    { name_ar: 'تفعيل بطاقة التموين', name_en: 'Activate Ration Card', category: 'Subsidy', description_ar: 'خدمات وزارة التموين', description_en: 'Ministry of Supply Services', icon: 'CreditCard', url: 'https://digital.gov.eg/supply/activate-card', carbon_impact_kg: 0.0 },
    { name_ar: 'إصدار توكيل', name_en: 'Issue Power of Attorney', category: 'Documentation', description_ar: 'خدمات الشهر العقاري', description_en: 'Real Estate Registry Services', icon: 'FileText', url: 'https://digital.gov.eg/documentation/power-of-attorney', carbon_impact_kg: 0.02 },
    { name_ar: 'طلب صورة رسمية', name_en: 'Official Copy Request', category: 'Documentation', description_ar: 'خدمات الشهر العقاري', description_en: 'Real Estate Registry', icon: 'FileText', url: 'https://digital.gov.eg/documentation/certified-copy', carbon_impact_kg: 0.02 },
    { name_ar: 'بدل فاقد الرقم القومي', name_en: 'Replace National ID', category: 'Civil Status', description_ar: 'خدمات السجل المدني', description_en: 'Civil Registry Services', icon: 'IdCard', url: 'https://digital.gov.eg/civil/replace-id', carbon_impact_kg: 0.03 },
    { name_ar: 'استخراج قيد ميلاد', name_en: 'Birth Certificate', category: 'Civil Status', description_ar: 'خدمات السجل المدني', description_en: 'Civil Registry', icon: 'FileText', url: 'https://digital.gov.eg/civil/birth-certificate', carbon_impact_kg: 0.03 },
    { name_ar: 'الاستعلام عن المخالفات', name_en: 'Traffic Violations', category: 'Traffic', description_ar: 'خدمات المرور', description_en: 'Traffic Services', icon: 'Car', url: 'https://digital.gov.eg/traffic/violations', carbon_impact_kg: 0.0 },
    { name_ar: 'تجديد رخصة المركبة', name_en: 'Renew Vehicle License', category: 'Traffic', description_ar: 'خدمات المرور', description_en: 'Traffic', icon: 'Car', url: 'https://digital.gov.eg/traffic/renew-license', carbon_impact_kg: 0.2 },
    { name_ar: 'استخراج قيد تجاري', name_en: 'Commercial Registry Extract', category: 'Commercial Registry', description_ar: 'خدمات السجل التجاري', description_en: 'Commercial Registry Services', icon: 'Building2', url: 'https://digital.gov.eg/commercial/extract', carbon_impact_kg: 0.1 },
    { name_ar: 'حجز موعد طبي', name_en: 'Book Medical Appointment', category: 'Health', description_ar: 'خدمات وزارة الصحة', description_en: 'Ministry of Health Services', icon: 'Activity', url: 'https://digital.gov.eg/health/book-appointment', carbon_impact_kg: 0.01 },
    { name_ar: 'نتيجة الثانوية العامة', name_en: 'High School Result', category: 'Education', description_ar: 'وزارة التربية والتعليم', description_en: 'Ministry of Education', icon: 'BookOpen', url: 'https://digital.gov.eg/education/high-school-result', carbon_impact_kg: 0.0 },
    { name_ar: 'حجز تذكرة قطار', name_en: 'Book Train Ticket', category: 'Transport', description_ar: 'سكك حديد مصر', description_en: 'Egypt Railways', icon: 'Train', url: 'https://enr.gov.eg', carbon_impact_kg: 0.5 },
    { name_ar: 'تكافل وكرامة', name_en: 'Takaful & Karama', category: 'Social Solidarity', description_ar: 'التضامن الاجتماعي', description_en: 'Social Solidarity', icon: 'HandHelping', url: 'https://tk.moss.gov.eg', carbon_impact_kg: 0.0 },
    { name_ar: 'رول جلسة', name_en: 'Session Roll', category: 'Justice', description_ar: 'وزارة العدل', description_en: 'Ministry of Justice', icon: 'Scale', url: 'https://moj.gov.eg', carbon_impact_kg: 0.01 },
    { name_ar: 'تأسيس شركة', name_en: 'Establish Company', category: 'Investment', description_ar: 'هيئة الاستثمار', description_en: 'Investment Authority', icon: 'Landmark', url: 'https://www.gafi.gov.eg', carbon_impact_kg: 0.2 },
    { name_ar: 'خدمات رخصة القيادة', name_en: 'Driving License Services', category: 'Traffic', description_ar: 'المرور', description_en: 'Traffic', icon: 'Car', url: 'https://digital.gov.eg/traffic/driving-license', carbon_impact_kg: 0.1 }
  ];

  for (const service of govServices) {
    // Check if exists
    const { data: existing } = await supabase.from('gov_services').select('id').eq('name_ar', service.name_ar).limit(1);
    if (!existing || existing.length === 0) {
      const { error } = await supabase.from('gov_services').insert(service);
      if (error) {
        console.log('Error inserting Gov Service:', service.name_ar, error);
      } else {
        console.log('Added Gov Service:', service.name_ar);
      }
    } else {
      console.log('Gov Service already exists:', service.name_ar);
    }
  }
}

run();
