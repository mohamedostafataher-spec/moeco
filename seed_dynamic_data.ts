import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function seed() {
  console.log("Seeding government_services...");
  
  const govServices = [
    {
      name_ar: 'استخراج بطاقة رقم قومي',
      name_en: 'Renew National ID',
      description_ar: 'تجديد أو استبدال بطاقة الرقم القومي المصري.',
      description_en: 'Renew or replace your Egyptian National ID card.',
      category: 'Civil Registry',
      url: 'https://digital.gov.eg/',
      is_active: true,
      carbon_impact_type: 'paper',
      carbon_impact_kg: 0.5
    },
    {
      name_ar: 'مخالفات المرور',
      name_en: 'Traffic Violations',
      description_ar: 'الاستعلام وسداد مخالفات رخص القيادة والمركبات.',
      description_en: 'Inquire and pay traffic violations for licenses and vehicles.',
      category: 'Traffic',
      url: 'https://ppo.gov.eg/',
      is_active: true,
      carbon_impact_type: 'transport',
      carbon_impact_kg: 12.5
    },
    {
      name_ar: 'خدمات التموين',
      name_en: 'Supply Services',
      description_ar: 'إدارة بطاقة التموين وإضافة المواليد.',
      description_en: 'Manage ration card and add newborns.',
      category: 'Subsidy',
      url: 'https://tamwin.com.eg/',
      is_active: true,
      carbon_impact_type: 'paper',
      carbon_impact_kg: 0.3
    }
  ];

  const { error: govErr } = await supabase.from('government_services').upsert(govServices, { onConflict: 'name_en' });
  if (govErr) console.error("Gov Services Seed Error:", govErr.message);
  else console.log("Gov Services Seeded.");

  console.log("Seeding Alerts (into scientific_data)...");
  
  const alerts = [
    {
      category: 'moeco_alert',
      key: 'alert_critical_1',
      value: {
        title_ar: 'تحذير عاصفة رملية',
        title_en: 'Sandstorm Warning',
        description_ar: 'عاصفة رملية شديدة تقترب من القاهرة، يرجى البقاء في المنازل.',
        description_en: 'Severe sandstorm approaching Cairo, please stay indoors.',
        severity: 'critical',
        governorate: 'Cairo',
        source: 'EMA',
        is_active: true
      }
    },
    {
      category: 'moeco_alert',
      key: 'alert_high_1',
      value: {
        title_ar: 'ارتفاع في مستويات التلوث',
        title_en: 'Air Pollution Spike',
        description_ar: 'تم رصد مستويات عالية من PM2.5 في منطقة الجيزة.',
        description_en: 'High PM2.5 levels detected in Giza area.',
        severity: 'high',
        governorate: 'Giza',
        source: 'MoE',
        is_active: true
      }
    }
  ];

  const { error: alertErr } = await supabase.from('scientific_data').upsert(alerts, { onConflict: 'key' });
  if (alertErr) console.error("Alerts Seed Error:", alertErr.message);
  else console.log("Alerts Seeded.");
}

seed();
