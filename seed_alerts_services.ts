import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

let url = process.env.VITE_SUPABASE_URL!;
if (url.endsWith('/')) url = url.slice(0, -1);
if (url.includes('/rest/v1')) url = url.split('/rest/v1')[0];

const supabase = createClient(url, process.env.VITE_SUPABASE_ANON_KEY!);

async function setupTables() {
  console.log("Ensuring tables dev...");
  
  // Create gov_services if missing
  // Note: I can't run raw SQL easily via the JS SDK without a custom function.
  // I will try to insert a dummy record to see if it allows it or fails with "not found".
  // Actually, I should use the schema check from earlier.
  
  // I will use government_services but add columns if needed, OR just create gov_services if I can.
  // Since I can't run CREATE TABLE directly, I'll assume they will be created by the user or I can try to use RPC if available.
  // Wait, I can use the existing government_services and just update the code if needed.
  // But the user said: "ONLY create missing tables/columns"
  
  // Let's try to detect if gov_services exists.
  const { error: govError } = await supabase.from('gov_services').select('id').limit(1);
  if (govError && govError.code === 'PGRST204') { // Table not found
      console.log("Table gov_services missing. I should use government_services and suggest renaming or aliasing.");
  }
}

async function seedData() {
    // Seed Alerts
    const alerts = [
        {
            title_ar: 'تنبيه عاصفة ترابية',
            title_en: 'Dust Storm Alert',
            description_ar: 'من المتوقع هبوب عواصف ترابية شديدة في القاهرة والجيزة. يرجى البقاء في المنازل.',
            description_en: 'Severe dust storms expected in Cairo and Giza. Please stay indoors.',
            severity: 'high',
            is_active: true,
            governorate: 'القاهرة',
            source: 'الأرصاد الجوية',
            published_at: new Date().toISOString()
        },
        {
            title_ar: 'انقطاع مياه مجدول',
            title_en: 'Scheduled Water Outage',
            description_ar: 'سيتم قطع المياه في المعادي للصيانة من الساعة ١٠ مساءً.',
            description_en: 'Water outage in Maadi for maintenance starting at 10 PM.',
            severity: 'medium',
            is_active: true,
            governorate: 'القاهرة',
            source: 'شركة المياه',
            published_at: new Date().toISOString()
        }
    ];

    for (const alert of alerts) {
        const { error } = await supabase.from('alerts').insert(alert);
        if (error) console.error("Alert insert fail:", error.message);
        else console.log("Alert seeded:", alert.title_en);
    }

    // Seed Gov Services
    const services = [
        {
            name_ar: 'استعلام عن فواتير الكهرباء',
            name_en: 'Electricity Bill Inquiry',
            title_ar: 'الكهرباء',
            title: 'Electricity',
            category: 'Utilities',
            description_ar: 'خدمة استخراج ومعرفة فواتير الكهرباء في مصر',
            description_en: 'Service to check electricity bills in Egypt',
            url: 'https://www.eehc.gov.eg/',
            is_active: true
        }
    ];

    for (const service of services) {
        const { error } = await supabase.from('gov_services').insert(service);
        if (error) console.error("Service insert fail:", error.message);
        else console.log("Service seeded:", service.name_en);
    }
}

seedData();
