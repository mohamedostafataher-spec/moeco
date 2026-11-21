import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

let url = process.env.VITE_SUPABASE_URL;
if (url?.includes('/rest/v1')) url = url.split('/rest/v1')[0];

const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

const sql = `
  CREATE TABLE IF NOT EXISTS gov_services (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT,
      title_ar TEXT,
      description TEXT,
      description_ar TEXT,
      category TEXT,
      icon TEXT,
      target_screen TEXT,
      external_url TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT now()
  );
  ALTER TABLE gov_services ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Public Gov Services Access" ON gov_services;
  CREATE POLICY "Public Gov Services Access" ON gov_services FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Service Role Gov Services Access" ON gov_services;
  CREATE POLICY "Service Role Gov Services Access" ON gov_services USING (true) WITH CHECK (true);
  NOTIFY pgrst, 'reload schema';
`;

async function run() {
  const queries = sql.split(';').map(q => q.trim()).filter(q => q.length > 0);
  for (const q of queries) {
    const { error } = await supabase.rpc('exec_sql', { sql_query: q });
    if (error && !error.message.includes('NOTIFY')) {
       console.log('Error:', error);
    }
  }
  
  const toInsert = [
    { title: 'National Portal', title_ar: 'المنصة الوطنية الموحدة', description: 'Digital Gov Services', description_ar: 'خدمات حكومية رقمية', external_url: 'https://digital.gov.eg', category: 'General', icon: 'Building2', is_active: true },
    { title: 'Health Insurance', title_ar: 'التأمين الصحي الشامل', description: 'Insurance system', description_ar: 'منظومة التأمين', external_url: 'https://uhia.gov.eg', category: 'Health', icon: 'HeartPulse', is_active: true },
    { title: 'Train Tickets', title_ar: 'حجز تذاكر القطارات', description: 'Egypt Railways', description_ar: 'سكك حديد مصر', target_screen: 'transport', category: 'Transport', icon: 'Train', is_active: true },
    { title: 'Environmental Complaints', title_ar: 'شكاوى بيئية', description: 'Report violations', description_ar: 'تبليغ عن مخالفات', target_screen: 'reporting', category: 'Environment', icon: 'AlertTriangle', is_active: true },
  ];
  
  const { error } = await supabase.from('gov_services').insert(toInsert);
  console.log('Insert:', error || 'Success');
}
run();
