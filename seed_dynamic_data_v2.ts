import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

let url = process.env.VITE_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (url.endsWith('/')) url = url.slice(0, -1);
if (url.includes('/rest/v1')) url = url.split('/rest/v1')[0];

const supabase = createClient(url, key);

async function seed() {
  console.log("Seeding government_services...");
  const { error: govErr } = await supabase.from('government_services').insert([
    {
      name_ar: 'استخراج بطاقة رقم قومي',
      name_en: 'Renew National ID',
      description_ar: 'تجديد أو استبدال بطاقة الرقم القومي المصري.',
      description_en: 'Renew or replace your Egyptian National ID card.',
      category: 'Civil Registry',
      url: 'https://digital.gov.eg/',
      is_active: true
    }
  ]);
  if (govErr) console.error("Gov Services Seed Error:", govErr.message);
  else console.log("Gov Services Seeded.");

  console.log("Seeding Alerts (into scientific_data)...");
  const { error: alertErr } = await supabase.from('scientific_data').insert([
    {
      category: 'moeco_alert',
      key: 'alert_critical_1_' + Date.now(),
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
    }
  ]);
  if (alertErr) console.error("Alerts Seed Error:", alertErr.message);
  else console.log("Alerts Seeded.");
}
seed();
